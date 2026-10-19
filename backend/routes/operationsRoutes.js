import express from 'express';
import { body, param, query } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import {
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
  putawayHandler,
  recordDrillHandler,
  recordFuelHandler,
  recordTripHandler,
  recordWeighingHandler,
  requestLeaveHandler,
  runDepreciationHandler,
  runPayrollHandler,
  setBudgetHandler
} from '../controllers/operationsController.js';

const router = express.Router();
const dateRule = (field) => body(field).matches(/^\d{4}-\d{2}-\d{2}$/);
const monthRule = (field) => body(field).matches(/^\d{4}-\d{2}$/);
const idParam = param('id').isMongoId();
const office = authorize('director', 'manager', 'storekeeper');
const payables = authorize('director', 'manager');
const director = authorize('director');

router.get('/employees', protect, director, listEmployeesHandler);
router.post(
  '/employees',
  protect,
  director,
  writeLimiter,
  [body('name').trim().isLength({ min: 2, max: 80 }), body('grossSalaryUgx').isFloat({ min: 0 }), body('branch').optional().isString()],
  validateRequest,
  createEmployeeHandler
);
router.post(
  '/attendance',
  protect,
  director,
  writeLimiter,
  [body('employeeId').isMongoId(), dateRule('date'), body('status').isIn(['present', 'absent', 'leave'])],
  validateRequest,
  markAttendanceHandler
);
router.get('/leave', protect, director, listLeaveHandler);
router.post(
  '/leave',
  protect,
  director,
  writeLimiter,
  [body('employeeId').isMongoId(), dateRule('from'), dateRule('to')],
  validateRequest,
  requestLeaveHandler
);
router.post(
  '/leave/:id/decision',
  protect,
  director,
  writeLimiter,
  [idParam, body('status').isIn(['approved', 'rejected'])],
  validateRequest,
  decideLeaveHandler
);
router.post('/payroll', protect, director, writeLimiter, [monthRule('month')], validateRequest, runPayrollHandler);

router.get('/bills', protect, payables, listBillsHandler);
router.post(
  '/bills',
  protect,
  payables,
  writeLimiter,
  [body('supplierId').isMongoId(), body('purchaseOrderId').isMongoId()],
  validateRequest,
  createBillHandler
);
router.post(
  '/bills/:id/payments',
  protect,
  payables,
  writeLimiter,
  [idParam, body('amountUgx').isFloat({ min: 1 }), dateRule('paidOn'), body('method').optional().isIn(['cash', 'bank'])],
  validateRequest,
  payBillHandler
);

router.get('/bins', protect, office, listBinsHandler);
router.post(
  '/bins',
  protect,
  office,
  writeLimiter,
  [body('code').trim().isLength({ min: 1, max: 40 }), body('aisle').optional().isString()],
  validateRequest,
  createBinHandler
);
router.post(
  '/putaway',
  protect,
  office,
  writeLimiter,
  [body('binId').isMongoId(), body('produceName').trim().notEmpty(), body('produceType').trim().notEmpty(), body('qtyKg').isFloat({ gt: 0 })],
  validateRequest,
  putawayHandler
);
router.post(
  '/pick-lists',
  protect,
  office,
  writeLimiter,
  [body('saleId').isMongoId()],
  validateRequest,
  createPickListHandler
);

router.get('/weighings/latest', protect, office, latestWeighingHandler);
router.post('/weighings', protect, office, writeLimiter, recordWeighingHandler);

router.get('/fiscal', protect, director, listFiscalHandler);

router.get('/assets', protect, director, listAssetsHandler);
router.post(
  '/assets',
  protect,
  director,
  writeLimiter,
  [
    body('name').trim().isLength({ min: 1, max: 80 }),
    body('costUgx').isFloat({ min: 1 }),
    body('lifeMonths').isInt({ min: 1 }),
    dateRule('acquiredOn')
  ],
  validateRequest,
  createAssetHandler
);
router.post('/depreciation', protect, director, writeLimiter, [monthRule('month')], validateRequest, runDepreciationHandler);
router.post(
  '/assets/:id/dispose',
  protect,
  director,
  writeLimiter,
  [idParam, dateRule('disposedOn')],
  validateRequest,
  disposeAssetHandler
);

router.get('/fleet', protect, payables, listFleetHandler);
router.post(
  '/vehicles',
  protect,
  payables,
  writeLimiter,
  [body('plate').trim().isLength({ min: 1, max: 20 })],
  validateRequest,
  createVehicleHandler
);
router.post(
  '/trips',
  protect,
  payables,
  writeLimiter,
  [
    body('vehicleId').isMongoId(),
    body('fromPlace').trim().notEmpty(),
    body('toPlace').trim().notEmpty(),
    body('km').isFloat({ min: 0 }),
    dateRule('travelledOn')
  ],
  validateRequest,
  recordTripHandler
);
router.post(
  '/fuel',
  protect,
  payables,
  writeLimiter,
  [body('vehicleId').isMongoId(), body('litres').isFloat({ min: 0 }), body('amountUgx').isFloat({ min: 0 }), dateRule('filledOn')],
  validateRequest,
  recordFuelHandler
);

router.post(
  '/budgets',
  protect,
  director,
  writeLimiter,
  [body('account').trim().notEmpty(), monthRule('month'), body('amountUgx').isFloat({ min: 0 })],
  validateRequest,
  setBudgetHandler
);
router.get('/budgets/variance', protect, director, [query('month').matches(/^\d{4}-\d{2}$/)], validateRequest, budgetVarianceHandler);

router.get('/restore-drills', protect, director, listDrillsHandler);
router.post('/restore-drills', protect, director, writeLimiter, recordDrillHandler);
router.post(
  '/portal-access',
  protect,
  payables,
  writeLimiter,
  [body('buyerId').isMongoId(), body('password').isLength({ min: 10 })],
  validateRequest,
  grantPortalHandler
);

export default router;
