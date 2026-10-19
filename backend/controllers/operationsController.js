import { forwardControllerError } from '../utils/httpError.js';
import { recordAudit } from '../services/auditService.js';
import {
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
  listAssets,
  listBills,
  listBins,
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
  recordFuel,
  recordRestoreDrill,
  recordTrip,
  recordWeighing,
  requestLeave,
  runDepreciation,
  runPayroll,
  setBudget
} from '../services/operationsService.js';

const wrap = (work) => async (req, res, next) => {
  try {
    const payload = await work(req);
    res.status(payload?.statusCode || 200).json(payload?.body ?? payload);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const audit = (req, action, entityType, result) =>
  recordAudit({
    actor: req.user,
    action,
    entityType,
    entityId: result?._id || result?.bill?._id || '',
    branch: result?.branch || result?.bill?.branch || req.body?.branch
  });

const listEmployeesHandler = wrap((req) => listEmployees({ actorUser: req.user, branch: req.query.branch }));
const createEmployeeHandler = wrap(async (req) => {
  const result = await createEmployee({ actorUser: req.user, payload: req.body });
  await audit(req, 'employee.create', 'Employee', result);
  return result;
});
const markAttendanceHandler = wrap(async (req) => {
  const result = await markAttendance({ actorUser: req.user, payload: req.body });
  await audit(req, 'attendance.mark', 'Attendance', result);
  return result;
});
const listLeaveHandler = wrap((req) => listLeave({ actorUser: req.user, branch: req.query.branch }));
const requestLeaveHandler = wrap(async (req) => {
  const result = await requestLeave({ actorUser: req.user, payload: req.body });
  await audit(req, 'leave.request', 'LeaveRequest', result);
  return result;
});
const decideLeaveHandler = wrap(async (req) => {
  const result = await decideLeave({ actorUser: req.user, id: req.params.id, status: req.body.status });
  await audit(req, 'leave.decide', 'LeaveRequest', result);
  return result;
});
const runPayrollHandler = wrap(async (req) => {
  const result = await runPayroll({ actorUser: req.user, month: req.body.month, branch: req.body.branch });
  await audit(req, 'payroll.run', 'PayRun', result);
  return result;
});
const listBillsHandler = wrap((req) => listBills({ actorUser: req.user, branch: req.query.branch }));
const createBillHandler = wrap(async (req) => {
  const result = await createSupplierBill({ actorUser: req.user, payload: req.body });
  await audit(req, 'supplier_bill.create', 'SupplierBill', result);
  return result;
});
const payBillHandler = wrap(async (req) => {
  const result = await paySupplierBill({ actorUser: req.user, id: req.params.id, payload: req.body });
  await audit(req, 'supplier_bill.pay', 'VendorPayment', result.payment);
  return result;
});
const listBinsHandler = wrap((req) => listBins({ actorUser: req.user, branch: req.query.branch }));
const createBinHandler = wrap(async (req) => {
  const result = await createBin({ actorUser: req.user, payload: req.body });
  await audit(req, 'bin.create', 'WarehouseBin', result);
  return result;
});
const putawayHandler = wrap(async (req) => {
  const result = await putaway({ actorUser: req.user, payload: req.body });
  await audit(req, 'bin.putaway', 'BinStock', result);
  return result;
});
const createPickListHandler = wrap(async (req) => {
  const result = await createPickList({ actorUser: req.user, saleId: req.body.saleId });
  await audit(req, 'pick_list.create', 'PickList', result);
  return result;
});
const recordWeighingHandler = wrap(async (req) => {
  const result = await recordWeighing({ actorUser: req.user, payload: req.body });
  await audit(req, 'weigh.record', 'WeighTicket', result);
  return result;
});
const latestWeighingHandler = wrap((req) => latestWeighing({ actorUser: req.user, branch: req.query.branch }));
const listFiscalHandler = wrap((req) => listFiscalDocuments({ actorUser: req.user, branch: req.query.branch }));
const listAssetsHandler = wrap((req) => listAssets({ actorUser: req.user, branch: req.query.branch }));
const createAssetHandler = wrap(async (req) => {
  const result = await createAsset({ actorUser: req.user, payload: req.body });
  await audit(req, 'asset.create', 'FixedAsset', result);
  return result;
});
const runDepreciationHandler = wrap(async (req) => {
  const result = await runDepreciation({ actorUser: req.user, month: req.body.month, branch: req.body.branch });
  await audit(req, 'asset.depreciate', 'FixedAsset', { branch: req.body.branch });
  return result;
});
const disposeAssetHandler = wrap(async (req) => {
  const result = await disposeAsset({ actorUser: req.user, id: req.params.id, disposedOn: req.body.disposedOn });
  await audit(req, 'asset.dispose', 'FixedAsset', result);
  return result;
});
const listFleetHandler = wrap((req) => listFleet({ actorUser: req.user, branch: req.query.branch }));
const createVehicleHandler = wrap(async (req) => {
  const result = await createVehicle({ actorUser: req.user, payload: req.body });
  await audit(req, 'vehicle.create', 'Vehicle', result);
  return result;
});
const recordTripHandler = wrap(async (req) => {
  const result = await recordTrip({ actorUser: req.user, payload: req.body });
  await audit(req, 'trip.record', 'Trip', result);
  return result;
});
const recordFuelHandler = wrap(async (req) => {
  const result = await recordFuel({ actorUser: req.user, payload: req.body });
  await audit(req, 'fuel.record', 'FuelLog', result);
  return result;
});
const setBudgetHandler = wrap(async (req) => {
  const result = await setBudget({ actorUser: req.user, payload: req.body });
  await audit(req, 'budget.set', 'BudgetLine', result);
  return result;
});
const budgetVarianceHandler = wrap((req) =>
  budgetVariance({ actorUser: req.user, branch: req.query.branch, month: req.query.month })
);
const recordDrillHandler = wrap(async (req) => {
  const result = await recordRestoreDrill();
  await audit(req, 'restore_drill.record', 'RestoreDrill', result);
  return result;
});
const listDrillsHandler = wrap(() => listRestoreDrills());
const grantPortalHandler = wrap(async (req) => {
  const result = await grantPortalAccess({
    actorUser: req.user,
    buyerId: req.body.buyerId,
    password: req.body.password
  });
  await audit(req, 'portal.grant', 'TrustedBuyer', { _id: req.body.buyerId, branch: req.user.branch });
  return result;
});
const portalLoginHandler = wrap((req) => portalLogin({ contact: req.body.contact, password: req.body.password }));
const portalHomeHandler = wrap((req) => portalHome(req.portalBuyer));

export {
  budgetVarianceHandler,
  createAssetHandler,
  createBillHandler,
  createBinHandler,
  createEmployeeHandler,
  createPickListHandler,
  createVehicleHandler,
  decideLeaveHandler,
  disposeAssetHandler,
  grantPortalHandler,
  latestWeighingHandler,
  listAssetsHandler,
  listBillsHandler,
  listBinsHandler,
  listDrillsHandler,
  listEmployeesHandler,
  listFiscalHandler,
  listFleetHandler,
  listLeaveHandler,
  markAttendanceHandler,
  payBillHandler,
  portalHomeHandler,
  portalLoginHandler,
  putawayHandler,
  recordDrillHandler,
  recordFuelHandler,
  recordTripHandler,
  recordWeighingHandler,
  requestLeaveHandler,
  runDepreciationHandler,
  runPayrollHandler,
  setBudgetHandler
};
