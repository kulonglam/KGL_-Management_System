import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 80 },
    branch: createBranchSchemaField(),
    jobTitle: { type: String, default: '', maxlength: 80 },
    contact: { type: String, default: '', maxlength: 20 },
    grossSalaryUgx: { type: Number, required: true, min: 0 },
    nssfNumber: { type: String, default: '', maxlength: 40 },
    tin: { type: String, default: '', maxlength: 40 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);
employeeSchema.index({ branch: 1, name: 1 });

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    branch: createBranchSchemaField(),
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    status: { type: String, enum: ['present', 'absent', 'leave'], required: true }
  },
  { timestamps: true }
);
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const leaveRequestSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    branch: createBranchSchemaField(),
    from: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    to: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    note: { type: String, default: '', maxlength: 300 }
  },
  { timestamps: true }
);

const payLineSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    name: { type: String, required: true },
    grossUgx: { type: Number, required: true },
    nssfEmployeeUgx: { type: Number, required: true },
    nssfEmployerUgx: { type: Number, required: true },
    payeUgx: { type: Number, required: true },
    netUgx: { type: Number, required: true }
  },
  { _id: false }
);

const payRunSchema = new mongoose.Schema(
  {
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    branch: { type: String, default: '' },
    lines: { type: [payLineSchema], default: [] },
    grossUgx: { type: Number, default: 0 },
    netUgx: { type: Number, default: 0 },
    payeUgx: { type: Number, default: 0 },
    nssfUgx: { type: Number, default: 0 }
  },
  { timestamps: true }
);
payRunSchema.index({ month: 1, branch: 1 }, { unique: true });

const supplierBillSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', default: null },
    reference: { type: String, default: '', maxlength: 60 },
    amountUgx: { type: Number, required: true, min: 1 },
    balanceUgx: { type: Number, required: true, min: 0 },
    billsAp: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const vendorPaymentSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    bill: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierBill', required: true },
    amountUgx: { type: Number, required: true, min: 1 },
    method: { type: String, enum: ['cash', 'bank'], default: 'bank' },
    paidOn: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }
  },
  { timestamps: true }
);

const warehouseBinSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    code: { type: String, required: true, maxlength: 40 },
    aisle: { type: String, default: '', maxlength: 40 }
  },
  { timestamps: true }
);
warehouseBinSchema.index({ branch: 1, code: 1 }, { unique: true });

const binStockSchema = new mongoose.Schema(
  {
    bin: { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseBin', required: true },
    branch: createBranchSchemaField(),
    produceName: { type: String, required: true },
    produceType: { type: String, required: true },
    qtyKg: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);
binStockSchema.index({ bin: 1, produceName: 1, produceType: 1 }, { unique: true });

const pickListSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', default: null },
    produceName: { type: String, required: true },
    produceType: { type: String, required: true },
    qtyKg: { type: Number, required: true, min: 1 },
    lines: {
      type: [
        new mongoose.Schema(
          {
            binCode: { type: String, default: '' },
            qtyKg: { type: Number, required: true }
          },
          { _id: false }
        )
      ],
      default: []
    },
    status: { type: String, enum: ['open', 'picked'], default: 'open' }
  },
  { timestamps: true }
);

const weighTicketSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField({ required: false }),
    scaleId: { type: String, required: true, maxlength: 40 },
    kg: { type: Number, required: true, min: 0 },
    stable: { type: Boolean, default: false },
    raw: { type: String, default: '', maxlength: 200 }
  },
  { timestamps: true }
);

const fiscalDocumentSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    branch: { type: String, default: '' },
    grossUgx: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'failed', 'not_configured'], default: 'pending' },
    providerStatus: { type: Number, default: 0 },
    providerBody: { type: String, default: '', maxlength: 2000 }
  },
  { timestamps: true }
);

const fixedAssetSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    name: { type: String, required: true, maxlength: 80 },
    costUgx: { type: Number, required: true, min: 1 },
    salvageUgx: { type: Number, default: 0, min: 0 },
    lifeMonths: { type: Number, required: true, min: 1 },
    acquiredOn: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    disposedOn: { type: String, default: '' },
    accumulatedUgx: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

const vehicleSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    plate: { type: String, required: true, maxlength: 20 },
    name: { type: String, default: '', maxlength: 80 }
  },
  { timestamps: true }
);
vehicleSchema.index({ plate: 1 }, { unique: true });

const tripSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    branch: createBranchSchemaField(),
    fromPlace: { type: String, required: true, maxlength: 80 },
    toPlace: { type: String, required: true, maxlength: 80 },
    km: { type: Number, required: true, min: 0 },
    driverName: { type: String, default: '', maxlength: 80 },
    travelledOn: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }
  },
  { timestamps: true }
);

const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    branch: createBranchSchemaField(),
    litres: { type: Number, required: true, min: 0 },
    amountUgx: { type: Number, required: true, min: 0 },
    filledOn: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }
  },
  { timestamps: true }
);

const budgetLineSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    account: { type: String, required: true, maxlength: 40 },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    amountUgx: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);
budgetLineSchema.index({ branch: 1, account: 1, month: 1 }, { unique: true });

const restoreDrillSchema = new mongoose.Schema(
  {
    ok: { type: Boolean, required: true },
    collections: { type: Number, default: 0 },
    documents: { type: Number, default: 0 },
    note: { type: String, default: '', maxlength: 300 }
  },
  { timestamps: true }
);

const leaderLeaseSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true },
    until: { type: Date, required: true }
  },
  { timestamps: true }
);

const Employee = mongoose.model('Employee', employeeSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
const PayRun = mongoose.model('PayRun', payRunSchema);
const SupplierBill = mongoose.model('SupplierBill', supplierBillSchema);
const VendorPayment = mongoose.model('VendorPayment', vendorPaymentSchema);
const WarehouseBin = mongoose.model('WarehouseBin', warehouseBinSchema);
const BinStock = mongoose.model('BinStock', binStockSchema);
const PickList = mongoose.model('PickList', pickListSchema);
const WeighTicket = mongoose.model('WeighTicket', weighTicketSchema);
const FiscalDocument = mongoose.model('FiscalDocument', fiscalDocumentSchema);
const FixedAsset = mongoose.model('FixedAsset', fixedAssetSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const Trip = mongoose.model('Trip', tripSchema);
const FuelLog = mongoose.model('FuelLog', fuelLogSchema);
const BudgetLine = mongoose.model('BudgetLine', budgetLineSchema);
const RestoreDrill = mongoose.model('RestoreDrill', restoreDrillSchema);
const LeaderLease = mongoose.model('LeaderLease', leaderLeaseSchema);

export {
  Attendance,
  BinStock,
  BudgetLine,
  Employee,
  FiscalDocument,
  FixedAsset,
  FuelLog,
  LeaderLease,
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
};
