import os from 'node:os';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Sale from '../models/Sale.js';
import StockBalance from '../models/StockBalance.js';
import Supplier from '../models/Supplier.js';
import Procurement from '../models/Procurement.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import TrustedBuyer from '../models/TrustedBuyer.js';
import TaxInvoice from '../models/TaxInvoice.js';
import GlJournalLine from '../models/GlJournalLine.js';
import {
  Attendance,
  BinStock,
  BudgetLine,
  Employee,
  FiscalDocument,
  FixedAsset,
  FuelLog,
  LeaveRequest,
  PayRun,
  PickList,
  RestoreDrill,
  SupplierBill,
  Trip,
  Vehicle,
  VendorPayment,
  WarehouseBin,
  WeighTicket
} from '../models/operationsModels.js';
import { isDirectorAccount } from './authService.js';
import { buildCustomerStatement } from './customerStatementService.js';
import { upsertJournalLines } from './journalPostingService.js';
import { backupDatabase, rehearseRestoreDatabase } from './databaseSnapshot.js';
import { getJwtClaimOptions } from '../config/security.js';
import { normalizeLocalPhone } from '../utils/phoneNumber.js';
import { trustedQuery } from '../utils/listQuery.js';
import { roundUgx } from '../utils/money.js';
import { netPayUgx } from '../utils/payrollMath.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

const fail = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const branchOf = (actorUser, branch) => {
  if (isDirectorAccount(actorUser)) return branch || actorUser.branch || '';
  if (branch && branch !== actorUser.branch) throw fail(403, 'Access denied to this branch data');
  return actorUser.branch;
};

const parseScale = (body) => {
  if (body && typeof body.raw === 'string' && body.raw.includes(',')) {
    const [scaleId, kgText, flag] = body.raw.split(',');
    return {
      scaleId: String(scaleId || body.scaleId || 'scale').trim(),
      kg: Number(kgText),
      stable: String(flag || '').trim().toUpperCase() === 'ST' || body.stable === true
    };
  }
  return {
    scaleId: String(body.scaleId || '').trim(),
    kg: Number(body.kg),
    stable: body.stable !== false
  };
};

const listEmployees = ({ actorUser, branch }) => {
  const resolved = branchOf(actorUser, branch);
  return Employee.find(resolved ? { branch: resolved } : {}).sort({ name: 1 }).lean();
};

const createEmployee = async ({ actorUser, payload }) => {
  const branch = branchOf(actorUser, payload.branch);
  if (!branch) throw fail(400, 'branch is required');
  const saved = await Employee.create({
    name: String(payload.name || '').trim(),
    branch,
    jobTitle: String(payload.jobTitle || '').trim(),
    contact: normalizeLocalPhone(payload.contact),
    grossSalaryUgx: roundUgx(payload.grossSalaryUgx),
    nssfNumber: String(payload.nssfNumber || '').trim(),
    tin: String(payload.tin || '').trim()
  });
  return saved.toObject();
};

const markAttendance = async ({ actorUser, payload }) => {
  const employee = await Employee.findById(payload.employeeId);
  if (!employee) throw fail(404, 'Employee not found');
  branchOf(actorUser, employee.branch);
  const row = await Attendance.findOneAndUpdate(
    { employee: employee._id, date: payload.date },
    { $set: { branch: employee.branch, status: payload.status } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return row.toObject();
};

const requestLeave = async ({ actorUser, payload }) => {
  const employee = await Employee.findById(payload.employeeId);
  if (!employee) throw fail(404, 'Employee not found');
  branchOf(actorUser, employee.branch);
  const saved = await LeaveRequest.create({
    employee: employee._id,
    branch: employee.branch,
    from: payload.from,
    to: payload.to,
    note: String(payload.note || '').slice(0, 300)
  });
  return saved.toObject();
};

const decideLeave = async ({ actorUser, id, status }) => {
  const leave = await LeaveRequest.findById(id);
  if (!leave) throw fail(404, 'Leave request not found');
  branchOf(actorUser, leave.branch);
  leave.status = status === 'approved' ? 'approved' : 'rejected';
  await leave.save();
  return leave.toObject();
};

const runPayroll = async ({ actorUser, month, branch }) => {
  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) throw fail(400, 'month must be YYYY-MM');
  const resolved = branchOf(actorUser, branch);
  const employees = await Employee.find({ isActive: true, ...(resolved ? { branch: resolved } : {}) }).lean();
  const lines = employees.map((employee) => {
    const pay = netPayUgx(employee.grossSalaryUgx);
    return {
      employee: employee._id,
      name: employee.name,
      grossUgx: roundUgx(employee.grossSalaryUgx),
      nssfEmployeeUgx: pay.employeeUgx,
      nssfEmployerUgx: pay.employerUgx,
      payeUgx: pay.payeUgx,
      netUgx: pay.netUgx
    };
  });
  const grossUgx = roundUgx(lines.reduce((sum, line) => sum + line.grossUgx, 0));
  const netUgx = roundUgx(lines.reduce((sum, line) => sum + line.netUgx, 0));
  const payeUgx = roundUgx(lines.reduce((sum, line) => sum + line.payeUgx, 0));
  const nssfUgx = roundUgx(lines.reduce((sum, line) => sum + line.nssfEmployeeUgx + line.nssfEmployerUgx, 0));
  const employerNssf = roundUgx(lines.reduce((sum, line) => sum + line.nssfEmployerUgx, 0));
  const run = await PayRun.findOneAndUpdate(
    { month, branch: resolved || '' },
    { $set: { lines, grossUgx, netUgx, payeUgx, nssfUgx } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const refId = String(run._id);
  await GlJournalLine.deleteMany({ eventType: 'payroll', refId });
  const stamp = new Date(`${month}-01T00:00:00.000Z`);
  const shared = { date: stamp, branch: resolved || '', eventType: 'payroll', refType: 'payRun', refId, currency: 'UGX', foreignAmount: 0, fxRateToUgx: 1 };
  await upsertJournalLines([
    { ...shared, account: '6300', debitUgx: roundUgx(grossUgx + employerNssf), creditUgx: 0, memo: `Salaries ${month}`, lineKey: `payroll|${refId}|salaries` },
    { ...shared, account: '1000', debitUgx: 0, creditUgx: netUgx, memo: `Net pay ${month}`, lineKey: `payroll|${refId}|net` },
    { ...shared, account: '2200', debitUgx: 0, creditUgx: nssfUgx, memo: `NSSF ${month}`, lineKey: `payroll|${refId}|nssf` },
    { ...shared, account: '2300', debitUgx: 0, creditUgx: payeUgx, memo: `PAYE ${month}`, lineKey: `payroll|${refId}|paye` }
  ]);
  return run.toObject();
};

const createSupplierBill = async ({ actorUser, payload }) => {
  const supplier = await Supplier.findById(payload.supplierId);
  if (!supplier) throw fail(404, 'Supplier not found');
  const order = await PurchaseOrder.findById(payload.purchaseOrderId);
  if (!order) throw fail(404, 'Purchase order not found');
  const branch = branchOf(actorUser, order.branch);
  if (String(order.supplier) !== String(supplier._id) || order.branch !== supplier.branch) {
    throw fail(400, 'That order is for a different supplier');
  }
  const existing = await SupplierBill.findOne({ purchaseOrder: order._id });
  if (existing) throw fail(409, 'This order already has a supplier bill');
  const receipts = await Procurement.find({ purchaseOrder: order._id, deletedAt: null }).lean();
  const amountUgx = roundUgx(receipts.reduce((sum, row) => sum + Number(row.costUgx || 0), 0));
  if (amountUgx < 1) throw fail(400, 'Receive the goods before recording the supplier bill');
  const bill = await SupplierBill.create({
    branch,
    supplier: supplier._id,
    purchaseOrder: order._id,
    reference: String(payload.reference || '').slice(0, 60),
    amountUgx,
    balanceUgx: amountUgx,
    billsAp: false
  });
  return bill.toObject();
};

const paySupplierBill = async ({ actorUser, id, payload }) => {
  const bill = await SupplierBill.findById(id);
  if (!bill) throw fail(404, 'Supplier bill not found');
  branchOf(actorUser, bill.branch);
  const amountUgx = roundUgx(payload.amountUgx);
  if (amountUgx > bill.balanceUgx) throw fail(400, 'Payment is larger than the open balance');
  const payment = await VendorPayment.create({
    branch: bill.branch,
    bill: bill._id,
    amountUgx,
    method: payload.method === 'cash' ? 'cash' : 'bank',
    paidOn: payload.paidOn
  });
  bill.balanceUgx = roundUgx(bill.balanceUgx - amountUgx);
  await bill.save();
  const cashAccount = payment.method === 'cash' ? '1000' : '1020';
  const shared = {
    date: new Date(`${payment.paidOn}T00:00:00.000Z`),
    branch: bill.branch,
    eventType: 'vendor_payment',
    refType: 'vendorPayment',
    refId: String(payment._id),
    currency: 'UGX',
    foreignAmount: 0,
    fxRateToUgx: 1
  };
  await upsertJournalLines([
    { ...shared, account: '2000', debitUgx: amountUgx, creditUgx: 0, memo: 'Supplier payment', lineKey: `vendor-pay|${payment._id}|ap` },
    { ...shared, account: cashAccount, debitUgx: 0, creditUgx: amountUgx, memo: 'Supplier payment', lineKey: `vendor-pay|${payment._id}|cash` }
  ]);
  return { bill: bill.toObject(), payment: payment.toObject() };
};

const listBills = ({ actorUser, branch }) => {
  const resolved = branchOf(actorUser, branch);
  return SupplierBill.find(resolved ? { branch: resolved } : {}).sort({ createdAt: -1 }).limit(100).populate('supplier', 'name').lean();
};

const createBin = async ({ actorUser, payload }) => {
  const branch = branchOf(actorUser, payload.branch);
  if (!branch) throw fail(400, 'branch is required');
  const saved = await WarehouseBin.create({ branch, code: String(payload.code || '').trim(), aisle: String(payload.aisle || '').trim() });
  return saved.toObject();
};

const listBins = async ({ actorUser, branch }) => {
  const resolved = branchOf(actorUser, branch);
  const bins = await WarehouseBin.find(resolved ? { branch: resolved } : {}).lean();
  const stocks = await BinStock.find(resolved ? { branch: resolved } : {}).lean();
  return bins.map((bin) => ({
    ...bin,
    stock: stocks.filter((row) => String(row.bin) === String(bin._id))
  }));
};

const putaway = async ({ actorUser, payload }) => {
  const bin = await WarehouseBin.findById(payload.binId);
  if (!bin) throw fail(404, 'Bin not found');
  branchOf(actorUser, bin.branch);
  const produceName = normalizeProduceName(payload.produceName);
  const produceType = normalizeProduceType(payload.produceType);
  const qtyKg = Number(payload.qtyKg);
  if (!(qtyKg > 0)) throw fail(400, 'qtyKg must be positive');
  const balance = await StockBalance.findOne({ branch: bin.branch, produceName, produceType }).lean();
  const onHand = Number(balance?.onHandKg || 0);
  const placed = await BinStock.aggregate([
    { $match: { branch: bin.branch, produceName, produceType } },
    { $group: { _id: null, qtyKg: { $sum: '$qtyKg' } } }
  ]);
  const already = Number(placed[0]?.qtyKg || 0);
  if (already + qtyKg > onHand + 0.001) throw fail(400, 'Bin quantity cannot exceed the branch stock');
  const row = await BinStock.findOneAndUpdate(
    { bin: bin._id, produceName, produceType },
    { $inc: { qtyKg }, $setOnInsert: { branch: bin.branch, bin: bin._id, produceName, produceType } },
    { upsert: true, new: true }
  );
  return row.toObject();
};

const createPickList = async ({ actorUser, saleId }) => {
  const sale = await Sale.findById(saleId).lean();
  if (!sale) throw fail(404, 'Sale not found');
  branchOf(actorUser, sale.branch);
  const stocks = await BinStock.find({
    branch: sale.branch,
    produceName: sale.produceName,
    produceType: sale.produceType,
    qtyKg: trustedQuery({ $gt: 0 })
  }).populate('bin', 'code');
  let remaining = Number(sale.tonnageKg);
  const lines = [];
  for (const row of stocks) {
    if (remaining <= 0) break;
    const take = Math.min(row.qtyKg, remaining);
    lines.push({ binCode: row.bin?.code || '', qtyKg: take });
    remaining -= take;
  }
  if (remaining > 0) lines.push({ binCode: '', qtyKg: remaining });
  const pick = await PickList.create({
    branch: sale.branch,
    sale: sale._id,
    produceName: sale.produceName,
    produceType: sale.produceType,
    qtyKg: sale.tonnageKg,
    lines
  });
  return pick.toObject();
};

const recordWeighing = async ({ actorUser, payload }) => {
  const parsed = parseScale(payload);
  if (!parsed.scaleId || !(parsed.kg >= 0)) throw fail(400, 'scaleId and kg are required');
  const branch = payload.branch ? branchOf(actorUser, payload.branch) : actorUser.branch || '';
  const ticket = await WeighTicket.create({
    branch: branch || undefined,
    scaleId: parsed.scaleId,
    kg: parsed.kg,
    stable: parsed.stable,
    raw: String(payload.raw || '').slice(0, 200)
  });
  return ticket.toObject();
};

const latestWeighing = ({ actorUser, branch }) => {
  const resolved = branchOf(actorUser, branch);
  return WeighTicket.findOne(resolved ? { branch: resolved, stable: true } : { stable: true }).sort({ createdAt: -1 }).lean();
};

const readFiscalCode = (body) => {
  try {
    const parsed = JSON.parse(body);
    return String(parsed?.fiscalCode || parsed?.code || parsed?.invoiceId || '').slice(0, 80);
  } catch {
    return '';
  }
};

const queueFiscalDocument = async (invoice) => {
  if (!invoice?.invoiceNumber) return null;
  const existing = await FiscalDocument.findOne({ invoiceNumber: invoice.invoiceNumber });
  if (existing) return existing;
  const doc = await FiscalDocument.create({
    invoiceNumber: invoice.invoiceNumber,
    branch: invoice.branch,
    grossUgx: Math.abs(Number(invoice.grossUgx || 0)),
    status: 'pending'
  });
  const base = String(process.env.EFRIS_BASE_URL || '').trim();
  const key = String(process.env.EFRIS_API_KEY || '').trim();
  if (!base || !key) {
    doc.status = 'not_configured';
    await doc.save();
    return doc.toObject();
  }
  try {
    const response = await fetch(base, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceNumber: doc.invoiceNumber,
        branch: doc.branch,
        grossUgx: doc.grossUgx
      })
    });
    doc.providerStatus = response.status;
    doc.providerBody = (await response.text()).slice(0, 2000);
    doc.status = response.ok ? 'accepted' : 'rejected';
    doc.fiscalCode = response.ok ? readFiscalCode(doc.providerBody) : '';
  } catch (error) {
    doc.status = 'failed';
    doc.providerBody = String(error.message || 'EFRIS request failed').slice(0, 2000);
  }
  await doc.save();
  return doc.toObject();
};

const listFiscalDocuments = ({ actorUser, branch }) => {
  const resolved = branchOf(actorUser, branch);
  return FiscalDocument.find(resolved ? { branch: resolved } : {}).sort({ createdAt: -1 }).limit(100).lean();
};

const createAsset = async ({ actorUser, payload }) => {
  const branch = branchOf(actorUser, payload.branch);
  if (!branch) throw fail(400, 'branch is required');
  const saved = await FixedAsset.create({
    branch,
    name: String(payload.name || '').trim(),
    costUgx: roundUgx(payload.costUgx),
    salvageUgx: roundUgx(payload.salvageUgx || 0),
    lifeMonths: Number(payload.lifeMonths),
    acquiredOn: payload.acquiredOn
  });
  const shared = {
    date: new Date(`${payload.acquiredOn}T00:00:00.000Z`),
    branch,
    eventType: 'asset_purchase',
    refType: 'fixedAsset',
    refId: String(saved._id),
    memo: saved.name,
    currency: 'UGX',
    foreignAmount: 0,
    fxRateToUgx: 1
  };
  await upsertJournalLines([
    { ...shared, account: '1500', debitUgx: saved.costUgx, creditUgx: 0, lineKey: `asset|${saved._id}|cost` },
    { ...shared, account: '1000', debitUgx: 0, creditUgx: saved.costUgx, lineKey: `asset|${saved._id}|cash` }
  ]);
  return saved.toObject();
};

const runDepreciation = async ({ actorUser, month, branch }) => {
  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) throw fail(400, 'month must be YYYY-MM');
  const resolved = branchOf(actorUser, branch);
  const assets = await FixedAsset.find({ disposedOn: '', ...(resolved ? { branch: resolved } : {}) }).lean();
  const lines = [];
  const touched = [];
  for (const asset of assets) {
    if (asset.acquiredOn.slice(0, 7) > month) continue;
    const monthly = roundUgx((asset.costUgx - asset.salvageUgx) / asset.lifeMonths);
    const room = roundUgx(asset.costUgx - asset.salvageUgx - Number(asset.accumulatedUgx || 0));
    const charge = Math.min(monthly, room);
    if (charge <= 0) continue;
    const lineKey = `depr|${asset._id}|${month}|expense`;
    const already = await GlJournalLine.findOne({ lineKey }).lean();
    if (already) continue;
    const shared = {
      date: new Date(`${month}-01T00:00:00.000Z`),
      branch: asset.branch,
      eventType: 'depreciation',
      refType: 'fixedAsset',
      refId: String(asset._id),
      memo: `${asset.name} ${month}`,
      currency: 'UGX',
      foreignAmount: 0,
      fxRateToUgx: 1
    };
    lines.push({ ...shared, account: '6200', debitUgx: charge, creditUgx: 0, lineKey });
    lines.push({ ...shared, account: '1600', debitUgx: 0, creditUgx: charge, lineKey: `depr|${asset._id}|${month}|accum` });
    touched.push({ id: asset._id, monthly: charge });
  }
  const posted = await upsertJournalLines(lines);
  for (const row of touched) {
    await FixedAsset.updateOne({ _id: row.id }, { $inc: { accumulatedUgx: row.monthly } });
  }
  return { month, ...posted };
};

const disposeAsset = async ({ actorUser, id, disposedOn }) => {
  const asset = await FixedAsset.findById(id);
  if (!asset) throw fail(404, 'Asset not found');
  branchOf(actorUser, asset.branch);
  asset.disposedOn = disposedOn;
  await asset.save();
  const taken = Math.min(roundUgx(asset.accumulatedUgx), asset.costUgx);
  const loss = roundUgx(asset.costUgx - taken);
  const shared = {
    date: new Date(`${disposedOn}T00:00:00.000Z`),
    branch: asset.branch,
    eventType: 'asset_disposal',
    refType: 'fixedAsset',
    refId: String(asset._id),
    memo: asset.name,
    currency: 'UGX',
    foreignAmount: 0,
    fxRateToUgx: 1
  };
  const lines = [{ ...shared, account: '1500', debitUgx: 0, creditUgx: asset.costUgx, lineKey: `asset|${asset._id}|dispose` }];
  if (taken > 0) lines.push({ ...shared, account: '1600', debitUgx: taken, creditUgx: 0, lineKey: `asset|${asset._id}|dispose-accum` });
  if (loss > 0) lines.push({ ...shared, account: '6200', debitUgx: loss, creditUgx: 0, lineKey: `asset|${asset._id}|dispose-loss` });
  await upsertJournalLines(lines);
  return asset.toObject();
};

const createVehicle = async ({ actorUser, payload }) => {
  const branch = branchOf(actorUser, payload.branch);
  if (!branch) throw fail(400, 'branch is required');
  const saved = await Vehicle.create({ branch, plate: String(payload.plate || '').trim().toUpperCase(), name: String(payload.name || '').trim() });
  return saved.toObject();
};

const recordTrip = async ({ actorUser, payload }) => {
  const vehicle = await Vehicle.findById(payload.vehicleId);
  if (!vehicle) throw fail(404, 'Vehicle not found');
  branchOf(actorUser, vehicle.branch);
  const saved = await Trip.create({
    vehicle: vehicle._id,
    branch: vehicle.branch,
    fromPlace: String(payload.fromPlace || '').trim(),
    toPlace: String(payload.toPlace || '').trim(),
    km: Number(payload.km),
    driverName: String(payload.driverName || '').trim(),
    travelledOn: payload.travelledOn
  });
  return saved.toObject();
};

const recordFuel = async ({ actorUser, payload }) => {
  const vehicle = await Vehicle.findById(payload.vehicleId);
  if (!vehicle) throw fail(404, 'Vehicle not found');
  branchOf(actorUser, vehicle.branch);
  const amountUgx = roundUgx(payload.amountUgx);
  const saved = await FuelLog.create({
    vehicle: vehicle._id,
    branch: vehicle.branch,
    litres: Number(payload.litres),
    amountUgx,
    filledOn: payload.filledOn
  });
  const shared = {
    date: new Date(`${payload.filledOn}T00:00:00.000Z`),
    branch: vehicle.branch,
    eventType: 'fuel',
    refType: 'fuelLog',
    refId: String(saved._id),
    memo: `Fuel ${vehicle.plate}`,
    currency: 'UGX',
    foreignAmount: 0,
    fxRateToUgx: 1
  };
  await upsertJournalLines([
    { ...shared, account: '6400', debitUgx: amountUgx, creditUgx: 0, lineKey: `fuel|${saved._id}|expense` },
    { ...shared, account: '1000', debitUgx: 0, creditUgx: amountUgx, lineKey: `fuel|${saved._id}|cash` }
  ]);
  return saved.toObject();
};

const listFleet = async ({ actorUser, branch }) => {
  const resolved = branchOf(actorUser, branch);
  const filter = resolved ? { branch: resolved } : {};
  const [vehicles, trips, fuel] = await Promise.all([
    Vehicle.find(filter).lean(),
    Trip.find(filter).sort({ travelledOn: -1 }).limit(50).lean(),
    FuelLog.find(filter).sort({ filledOn: -1 }).limit(50).lean()
  ]);
  return { vehicles, trips, fuel };
};

const setBudget = async ({ actorUser, payload }) => {
  const branch = branchOf(actorUser, payload.branch);
  if (!branch) throw fail(400, 'branch is required');
  const saved = await BudgetLine.findOneAndUpdate(
    { branch, account: String(payload.account).trim(), month: payload.month },
    { $set: { amountUgx: roundUgx(payload.amountUgx) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return saved.toObject();
};

const budgetVariance = async ({ actorUser, branch, month }) => {
  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) throw fail(400, 'month must be YYYY-MM');
  const resolved = branchOf(actorUser, branch);
  const lines = await BudgetLine.find({ month, ...(resolved ? { branch: resolved } : {}) }).lean();
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const actuals = await GlJournalLine.aggregate([
    { $match: { date: { $gte: start, $lt: end }, ...(resolved ? { branch: resolved } : {}) } },
    { $group: { _id: '$account', debitUgx: { $sum: '$debitUgx' }, creditUgx: { $sum: '$creditUgx' } } }
  ]);
  const actualByAccount = new Map(actuals.map((row) => [row._id, roundUgx(row.debitUgx - row.creditUgx)]));
  return lines.map((line) => {
    const actualUgx = actualByAccount.get(line.account) || 0;
    return { ...line, actualUgx, varianceUgx: roundUgx(line.amountUgx - actualUgx) };
  });
};

const recordRestoreDrill = async () => {
  const directory = path.join(os.tmpdir(), `kgl-restore-drill-${Date.now()}`);
  await backupDatabase(directory);
  const rehearsal = await rehearseRestoreDatabase(directory);
  const documents = rehearsal.collections.reduce((sum, entry) => sum + entry.count, 0);
  const saved = await RestoreDrill.create({
    ok: true,
    collections: rehearsal.collections.length,
    documents,
    note: 'Snapshot was restored into a scratch database, checked, and removed. The live database was not overwritten.'
  });
  return saved.toObject();
};

const listRestoreDrills = () => RestoreDrill.find({}).sort({ createdAt: -1 }).limit(20).lean();

const listLeave = ({ actorUser, branch }) => {
  const resolved = branchOf(actorUser, branch);
  return LeaveRequest.find(resolved ? { branch: resolved } : {})
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('employee', 'name')
    .lean();
};

const listAssets = ({ actorUser, branch }) => {
  const resolved = branchOf(actorUser, branch);
  return FixedAsset.find({ disposedOn: '', ...(resolved ? { branch: resolved } : {}) }).sort({ name: 1 }).lean();
};

const grantPortalAccess = async ({ actorUser, buyerId, password }) => {
  if (!/^(?=.*[A-Za-z])(?=.*\d).{10,}$/.test(String(password || ''))) {
    throw fail(400, 'Portal password needs 10 characters, including a letter and a number');
  }
  const buyer = await TrustedBuyer.findById(buyerId).select('+portalPasswordHash');
  if (!buyer) throw fail(404, 'Trusted buyer not found');
  branchOf(actorUser, buyer.branch);
  buyer.portalPasswordHash = await bcrypt.hash(password, 10);
  await buyer.save();
  return { buyerId: String(buyer._id), enabled: true };
};

const portalLogin = async ({ contact, password }) => {
  const phone = normalizeLocalPhone(contact);
  const buyer = await TrustedBuyer.findOne({ contact: phone, deletedAt: null }).select('+portalPasswordHash');
  if (!buyer?.portalPasswordHash || !(await bcrypt.compare(String(password || ''), buyer.portalPasswordHash))) {
    throw fail(401, 'Phone or password is wrong');
  }
  if (!process.env.JWT_SECRET) throw fail(500, 'JWT_SECRET is not configured');
  const token = jwt.sign(
    { id: String(buyer._id), typ: 'portal', tokenVersion: 0 },
    process.env.JWT_SECRET,
    { expiresIn: '12h', ...getJwtClaimOptions() }
  );
  return { token, buyer: { id: String(buyer._id), name: buyer.name, branch: buyer.branch } };
};

const portalHome = async (buyer) => {
  const statement = await buildCustomerStatement({
    actorUser: { role: 'manager', branch: buyer.branch },
    buyerId: buyer._id
  });
  const invoices = await TaxInvoice.find({ branch: buyer.branch, buyerName: buyer.name }).sort({ issuedAt: -1 }).limit(20).lean();
  return { buyer: { id: String(buyer._id), name: buyer.name, branch: buyer.branch }, statement, invoices };
};

export {
  budgetVariance,
  createAsset,
  createBin,
  createEmployee,
  createPickList,
  createSupplierBill,
  createVehicle,
  decideLeave,
  disposeAsset,
  grantPortalAccess,
  latestWeighing,
  listBills,
  listBins,
  listAssets,
  listEmployees,
  listFiscalDocuments,
  listFleet,
  listLeave,
  listRestoreDrills,
  markAttendance,
  paySupplierBill,
  portalHome,
  portalLogin,
  putaway,
  queueFiscalDocument,
  recordFuel,
  recordRestoreDrill,
  recordTrip,
  recordWeighing,
  requestLeave,
  runDepreciation,
  runPayroll,
  setBudget
};
