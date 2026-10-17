// Defines express-validator chains that enforce payload shape and business constraints.
 
import { body, param, query } from 'express-validator';
import { LOCAL_PHONE_PATTERN, normalizeLocalPhone } from '../utils/phoneNumber.js';
import { isRegisteredBranch } from '../config/branches.js';
import { WEBHOOK_EVENTS } from '../models/WebhookSubscription.js';
import { API_KEY_SCOPES } from '../models/ApiKey.js';

// Configure produce types.
const PRODUCE_TYPES = ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans'];
// Configure source types.
const SOURCE_TYPES = ['individual', 'company', 'kgl_farm'];
const ROLES = ['director', 'manager', 'sales_agent', 'storekeeper', 'auditor'];
const ALPHANUMERIC_TEXT = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;
// Configure phone pattern.
const PHONE_PATTERN = LOCAL_PHONE_PATTERN;
// Configure nin pattern.
const NIN_PATTERN = /^(CM|CF)[0-9]{12}$/;
// Configure time pattern.
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
// Configure password complexity pattern.
const PASSWORD_COMPLEXITY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
// Configure validation limits.
const VALIDATION_LIMITS = {
  textMinLength: 2,
  saleAndCreditTonnageMin: 1,
  procurementTonnageMin: 100,
  procurementIndividualTonnageMin: 1000,
  moneyMinUgx: 10000
};
// Configure local validation rules.
const FORM_VALIDATION_RULES = {
  procurement: {
    produceName: { minLength: VALIDATION_LIMITS.textMinLength },
    tonnageKg: {
      min: VALIDATION_LIMITS.procurementTonnageMin,
      conditionalMin: {
        equals: 'individual',
        min: VALIDATION_LIMITS.procurementIndividualTonnageMin
      }
    },
    costUgx: { min: VALIDATION_LIMITS.moneyMinUgx },
    dealerName: { minLength: VALIDATION_LIMITS.textMinLength }
  },
  sale: {
    produceName: { minLength: VALIDATION_LIMITS.textMinLength },
    tonnageKg: { min: VALIDATION_LIMITS.saleAndCreditTonnageMin },
    buyerName: { minLength: VALIDATION_LIMITS.textMinLength }
  },
  creditSale: {
    produceName: { minLength: VALIDATION_LIMITS.textMinLength },
    tonnageKg: { min: VALIDATION_LIMITS.saleAndCreditTonnageMin }
  },
  trustedBuyer: {
    name: { minLength: VALIDATION_LIMITS.textMinLength },
    location: { minLength: VALIDATION_LIMITS.textMinLength }
  }
};

const procurementRules = FORM_VALIDATION_RULES.procurement;
const saleRules = FORM_VALIDATION_RULES.sale;
const creditSaleRules = FORM_VALIDATION_RULES.creditSale;
const trustedBuyerRules = FORM_VALIDATION_RULES.trustedBuyer;

// Configure mongo id param validation.
const mongoIdParamValidation = [param('id').isMongoId().withMessage('Invalid id')];

// Configure pagination validation.
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('limit must be between 1 and 200'),
  query('search').optional().isString().trim().isLength({ max: 80 }).withMessage('search is too long'),
  query('status').optional().isString().trim(),
  query('produceType').optional().isString().trim(),
  query('sort').optional().isString().trim()
];

// Configure login validation.
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('username is required')
    .isLength({ min: 2 })
    .withMessage('username must be at least 2 characters'),
  body('password')
    .notEmpty()
    .withMessage('password is required')
    .isLength({ min: 10 })
    .withMessage('password must be at least 10 characters')
    .matches(PASSWORD_COMPLEXITY_PATTERN)
    .withMessage('password must include uppercase, lowercase, number, and symbol'),
  body('rememberMe').optional().isBoolean().withMessage('rememberMe must be true or false')
];

// Configure register validation.
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('name is required')
    .isLength({ min: 2 })
    .withMessage('name must be at least 2 characters')
    .matches(/^[A-Za-z0-9\s.]+$/)
    .withMessage('name must be alphanumeric'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('username is required')
    .isLength({ min: 2 })
    .withMessage('username must be at least 2 characters'),
  body('password')
    .notEmpty()
    .withMessage('password is required')
    .isLength({ min: 10 })
    .withMessage('password must be at least 10 characters')
    .matches(PASSWORD_COMPLEXITY_PATTERN)
    .withMessage('password must include uppercase, lowercase, number, and symbol'),
  body('role').trim().isIn(ROLES).withMessage('Invalid role'),
  body('branch').optional({ values: 'falsy' }).trim().custom((value) => {
    if (value && !isRegisteredBranch(value)) {
      throw new Error('Invalid branch');
    }
    return true;
  })
];

// Configure profile update validation.
const profileUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('name must be at least 2 characters')
    .matches(/^[A-Za-z0-9\s.]+$/)
    .withMessage('name must be alphanumeric'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('username must be at least 2 characters'),
  body('password')
    .optional()
    .isLength({ min: 10 })
    .withMessage('password must be at least 10 characters')
    .matches(PASSWORD_COMPLEXITY_PATTERN)
    .withMessage('password must include uppercase, lowercase, number, and symbol')
];

// Configure user update validation.
const userUpdateValidation = [
  ...mongoIdParamValidation,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('name must be at least 2 characters')
    .matches(/^[A-Za-z0-9\s.]+$/)
    .withMessage('name must be alphanumeric'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('username must be at least 2 characters'),
  body('role').optional().trim().isIn(ROLES).withMessage('Invalid role'),
  body('branch').optional().trim().custom((value) => {
    if (value && !isRegisteredBranch(value)) {
      throw new Error('Invalid branch');
    }
    return true;
  }),
  body('password')
    .optional()
    .isLength({ min: 10 })
    .withMessage('password must be at least 10 characters')
    .matches(PASSWORD_COMPLEXITY_PATTERN)
    .withMessage('password must include uppercase, lowercase, number, and symbol')
];

// Configure procurement create validation.
const procurementCreateValidation = [
  body('produceName')
    .trim()
    .notEmpty()
    .withMessage('produceName is required')
    .isLength({ min: procurementRules.produceName.minLength })
    .withMessage(`produceName must be at least ${procurementRules.produceName.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('produceName must be alphanumeric'),
  body('produceType')
    .trim()
    .notEmpty()
    .withMessage('produceType is required')
    .isIn(PRODUCE_TYPES)
    .withMessage('Invalid produceType'),
  body('sourceType')
    .trim()
    .notEmpty()
    .withMessage('sourceType is required')
    .isIn(SOURCE_TYPES)
    .withMessage('Invalid source type'),
  body('dateReceived')
    .notEmpty()
    .withMessage('dateReceived is required')
    .isISO8601()
    .withMessage('dateReceived must be a valid date'),
  body('timeReceived')
    .notEmpty()
    .withMessage('timeReceived is required')
    .matches(TIME_PATTERN)
    .withMessage('timeReceived must be in HH:mm format'),
  body('tonnageKg')
    .notEmpty()
    .withMessage('tonnageKg is required')
    .isFloat({ min: procurementRules.tonnageKg.min })
    .withMessage(`tonnageKg must be at least ${procurementRules.tonnageKg.min}`)
    .custom((value, { req }) => {
      if (
        req.body.sourceType === procurementRules.tonnageKg.conditionalMin.equals &&
        Number(value) < procurementRules.tonnageKg.conditionalMin.min
      ) {
        throw new Error(
          `tonnageKg must be at least ${procurementRules.tonnageKg.conditionalMin.min} for individual sourceType`
        );
      }
      return true;
    }),
  body('costUgx')
    .notEmpty()
    .withMessage('costUgx is required')
    .isFloat({ min: procurementRules.costUgx.min })
    .withMessage(`costUgx must be at least ${procurementRules.costUgx.min}`),
  body('supplierId').optional({ values: 'falsy' }).isMongoId().withMessage('supplierId must be a valid id'),
  body('dealerName')
    .trim()
    .notEmpty()
    .withMessage('dealerName is required')
    .isLength({ min: procurementRules.dealerName.minLength })
    .withMessage(`dealerName must be at least ${procurementRules.dealerName.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('dealerName must be alphanumeric'),
  body('dealerContact')
    .trim()
    .customSanitizer(normalizeLocalPhone)
    .notEmpty()
    .withMessage('dealerContact is required')
    .matches(PHONE_PATTERN)
    .withMessage('dealerContact must use the 07XXXXXXXX format')
];

// Configure procurement update validation.
const procurementUpdateValidation = [
  ...mongoIdParamValidation,
  body('produceName')
    .optional()
    .trim()
    .isLength({ min: procurementRules.produceName.minLength })
    .withMessage(`produceName must be at least ${procurementRules.produceName.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('produceName must be alphanumeric'),
  body('produceType').optional().trim().isIn(PRODUCE_TYPES).withMessage('Invalid produceType'),
  body('sourceType').optional().trim().isIn(SOURCE_TYPES).withMessage('Invalid source type'),
  body('dateReceived').optional().isISO8601().withMessage('dateReceived must be a valid date'),
  body('timeReceived')
    .optional()
    .matches(TIME_PATTERN)
    .withMessage('timeReceived must be in HH:mm format'),
  body('tonnageKg')
    .optional()
    .isFloat({ min: procurementRules.tonnageKg.min })
    .withMessage(`tonnageKg must be at least ${procurementRules.tonnageKg.min}`)
    .custom((value, { req }) => {
      if (
        req.body.sourceType === procurementRules.tonnageKg.conditionalMin.equals &&
        Number(value) < procurementRules.tonnageKg.conditionalMin.min
      ) {
        throw new Error(
          `tonnageKg must be at least ${procurementRules.tonnageKg.conditionalMin.min} for individual sourceType`
        );
      }
      return true;
    }),
  body('costUgx')
    .optional()
    .isFloat({ min: procurementRules.costUgx.min })
    .withMessage(`costUgx must be at least ${procurementRules.costUgx.min}`),
  body('dealerName')
    .optional()
    .trim()
    .isLength({ min: procurementRules.dealerName.minLength })
    .withMessage(`dealerName must be at least ${procurementRules.dealerName.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('dealerName must be alphanumeric'),
  body('dealerContact')
    .optional()
    .trim()
    .customSanitizer(normalizeLocalPhone)
    .matches(PHONE_PATTERN)
    .withMessage('dealerContact must use the 07XXXXXXXX format')
];

// Configure sale create validation.
const saleCreateValidation = [
  body('produceName')
    .trim()
    .notEmpty()
    .withMessage('produceName is required')
    .isLength({ min: saleRules.produceName.minLength })
    .withMessage(`produceName must be at least ${saleRules.produceName.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('produceName must be alphanumeric'),
  body('produceType').optional().trim().isIn(PRODUCE_TYPES).withMessage('Invalid produceType'),
  body('tonnageKg')
    .notEmpty()
    .withMessage('tonnageKg is required')
    .isFloat({ min: saleRules.tonnageKg.min })
    .withMessage(`tonnageKg must be at least ${saleRules.tonnageKg.min}`),
  body('buyerName')
    .trim()
    .notEmpty()
    .withMessage('buyerName is required')
    .isLength({ min: saleRules.buyerName.minLength })
    .withMessage(`buyerName must be at least ${saleRules.buyerName.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('buyerName must be alphanumeric'),
  body('date')
    .notEmpty()
    .withMessage('date is required')
    .isISO8601()
    .withMessage('date must be a valid date'),
  body('time')
    .notEmpty()
    .withMessage('time is required')
    .matches(TIME_PATTERN)
    .withMessage('time must be in HH:mm format'),
  body('paymentMethod')
    .optional()
    .trim()
    .isIn(['cash', 'momo', 'bank'])
    .withMessage('paymentMethod must be cash, momo, or bank'),
  body('tenderAmountUgx')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('tenderAmountUgx must be a non-negative number')
];

// Configure sale update validation (manager correction fields).
const saleUpdateValidation = [
  ...mongoIdParamValidation,
  body('produceName')
    .optional()
    .trim()
    .isLength({ min: saleRules.produceName.minLength })
    .withMessage(`produceName must be at least ${saleRules.produceName.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('produceName must be alphanumeric'),
  body('produceType').optional().trim().isIn(PRODUCE_TYPES).withMessage('Invalid produceType'),
  body('tonnageKg')
    .optional()
    .isFloat({ min: saleRules.tonnageKg.min })
    .withMessage(`tonnageKg must be at least ${saleRules.tonnageKg.min}`),
  body('buyerName')
    .optional()
    .trim()
    .isLength({ min: saleRules.buyerName.minLength })
    .withMessage(`buyerName must be at least ${saleRules.buyerName.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('buyerName must be alphanumeric'),
  body('salesAgentName')
    .optional()
    .trim()
    .isLength({ min: saleRules.buyerName.minLength })
    .withMessage(`salesAgentName must be at least ${saleRules.buyerName.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('salesAgentName must be alphanumeric'),
  body('date').optional().isISO8601().withMessage('date must be a valid date'),
  body('time')
    .optional()
    .matches(TIME_PATTERN)
    .withMessage('time must be in HH:mm format')
];

// Configure credit sale create validation.
const creditSaleCreateValidation = [
  body('trustedBuyerId')
    .notEmpty()
    .withMessage('trustedBuyerId is required')
    .isMongoId()
    .withMessage('trustedBuyerId is required'),
  body('dueDate')
    .notEmpty()
    .withMessage('dueDate is required')
    .isISO8601()
    .withMessage('dueDate must be a valid date'),
  body('dateOfDispatch')
    .notEmpty()
    .withMessage('dateOfDispatch is required')
    .isISO8601()
    .withMessage('dateOfDispatch must be a valid date'),
  body('produceName')
    .trim()
    .notEmpty()
    .withMessage('produceName is required')
    .isLength({ min: creditSaleRules.produceName.minLength })
    .withMessage(`produceName must be at least ${creditSaleRules.produceName.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('produceName must be alphanumeric'),
  body('produceType')
    .trim()
    .notEmpty()
    .withMessage('produceType is required')
    .isIn(PRODUCE_TYPES)
    .withMessage('Invalid produceType'),
  body('tonnageKg')
    .notEmpty()
    .withMessage('tonnageKg is required')
    .isFloat({ min: creditSaleRules.tonnageKg.min })
    .withMessage(`tonnageKg must be at least ${creditSaleRules.tonnageKg.min}`)
];

// Configure credit sale update validation (manager correction fields only).
const creditSaleUpdateValidation = [
  ...mongoIdParamValidation,
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('dueDate must be a valid date'),
  body('dateOfDispatch')
    .optional()
    .isISO8601()
    .withMessage('dateOfDispatch must be a valid date')
];

// Configure credit payment status validation.
const creditPaymentStatusValidation = [
  ...mongoIdParamValidation,
  body('isPaid').isBoolean().withMessage('isPaid must be a boolean')
];

// Configure credit repayment validation.
const creditRepaymentValidation = [
  ...mongoIdParamValidation,
  body('amountUgx')
    .isInt({ gt: 0 })
    .withMessage('amountUgx must be a whole number of UGX greater than 0')
    .toInt(),
  body('paidAt').optional().isISO8601().withMessage('paidAt must be a valid date')
];

const trustedBuyerEmailRule = () =>
  body('email')
    .optional({ values: 'null' })
    .trim()
    .custom((value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    .withMessage('email must be a valid email address')
    .isLength({ max: 254 })
    .withMessage('email must be at most 254 characters');

// Configure trusted buyer create validation.
const trustedBuyerCreateValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('name is required')
    .isLength({ min: trustedBuyerRules.name.minLength })
    .withMessage(`name must be at least ${trustedBuyerRules.name.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('name must be alphanumeric'),
  body('nationalId')
    .trim()
    .notEmpty()
    .withMessage('nationalId is required')
    .toUpperCase()
    .matches(NIN_PATTERN)
    .withMessage('nationalId must be a valid NIN'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('location is required')
    .isLength({ min: trustedBuyerRules.location.minLength })
    .withMessage(`location must be at least ${trustedBuyerRules.location.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('location must be alphanumeric'),
  body('contact')
    .trim()
    .customSanitizer(normalizeLocalPhone)
    .notEmpty()
    .withMessage('contact is required')
    .matches(PHONE_PATTERN)
    .withMessage('contact must use the 07XXXXXXXX format'),
  trustedBuyerEmailRule(),
  body('creditLimitUgx')
    .optional({ values: 'null' })
    .custom((value) => value === null || value === '' || Number.isFinite(Number(value)))
    .withMessage('creditLimitUgx must be a number or null')
    .customSanitizer((value) =>
      value === null || value === '' || value === undefined ? null : Number(value)
    )
    .custom((value) => value === null || value >= 0)
    .withMessage('creditLimitUgx must be at least 0')
];

// Configure trusted buyer update validation.
const trustedBuyerUpdateValidation = [
  ...mongoIdParamValidation,
  body('name')
    .optional()
    .trim()
    .isLength({ min: trustedBuyerRules.name.minLength })
    .withMessage(`name must be at least ${trustedBuyerRules.name.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('name must be alphanumeric'),
  body('nationalId')
    .optional()
    .trim()
    .toUpperCase()
    .matches(NIN_PATTERN)
    .withMessage('nationalId must be a valid NIN'),
  body('location')
    .optional()
    .trim()
    .isLength({ min: trustedBuyerRules.location.minLength })
    .withMessage(`location must be at least ${trustedBuyerRules.location.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('location must be alphanumeric'),
  body('contact')
    .optional()
    .trim()
    .customSanitizer(normalizeLocalPhone)
    .matches(PHONE_PATTERN)
    .withMessage('contact must use the 07XXXXXXXX format'),
  trustedBuyerEmailRule(),
  body('creditLimitUgx')
    .optional({ values: 'null' })
    .custom((value) => value === null || value === '' || Number.isFinite(Number(value)))
    .withMessage('creditLimitUgx must be a number or null')
    .customSanitizer((value) =>
      value === null || value === '' || value === undefined ? null : Number(value)
    )
    .custom((value) => value === null || value >= 0)
    .withMessage('creditLimitUgx must be at least 0')
];

const supplierCreateValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('name is required')
    .isLength({ min: VALIDATION_LIMITS.textMinLength })
    .withMessage(`name must be at least ${VALIDATION_LIMITS.textMinLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('name must be alphanumeric'),
  body('contact')
    .trim()
    .customSanitizer(normalizeLocalPhone)
    .notEmpty()
    .withMessage('contact is required')
    .matches(PHONE_PATTERN)
    .withMessage('contact must use the 07XXXXXXXX format'),
  body('sourceType')
    .optional()
    .trim()
    .isIn(SOURCE_TYPES)
    .withMessage('Invalid source type')
];

const supplierUpdateValidation = [
  ...mongoIdParamValidation,
  body('name')
    .optional()
    .trim()
    .isLength({ min: VALIDATION_LIMITS.textMinLength })
    .withMessage(`name must be at least ${VALIDATION_LIMITS.textMinLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('name must be alphanumeric'),
  body('contact')
    .optional()
    .trim()
    .customSanitizer(normalizeLocalPhone)
    .matches(PHONE_PATTERN)
    .withMessage('contact must use the 07XXXXXXXX format'),
  body('sourceType').optional().trim().isIn(SOURCE_TYPES).withMessage('Invalid source type'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean()
];

const voidReasonValidation = [
  ...mongoIdParamValidation,
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('reason is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('reason must be between 5 and 500 characters')
];

const transferCreateValidation = [
  body('fromBranch').optional().trim().notEmpty().withMessage('fromBranch is required'),
  body('toBranch').trim().notEmpty().withMessage('toBranch is required'),
  body('note').optional().trim().isLength({ max: 500 }),
  body('lines').isArray({ min: 1 }).withMessage('lines must include at least one item'),
  body('lines.*.produceName').trim().notEmpty().withMessage('produceName is required'),
  body('lines.*.produceType').trim().isIn(PRODUCE_TYPES).withMessage('Invalid produceType'),
  body('lines.*.tonnageKg').isFloat({ min: 1 }).withMessage('tonnageKg must be at least 1')
];

const adjustmentCreateValidation = [
  body('produceName').trim().notEmpty().withMessage('produceName is required'),
  body('produceType').trim().isIn(PRODUCE_TYPES).withMessage('Invalid produceType'),
  body('deltaKg')
    .notEmpty()
    .withMessage('deltaKg is required')
    .isFloat()
    .withMessage('deltaKg must be a number')
    .custom((value) => Number(value) !== 0)
    .withMessage('deltaKg must be non-zero'),
  body('reasonCode')
    .trim()
    .isIn(['damage', 'shrinkage', 'found', 'correction', 'other'])
    .withMessage('Invalid reasonCode'),
  body('note').trim().notEmpty().withMessage('note is required').isLength({ max: 500 }),
  body('branch').optional().trim().notEmpty()
];

const stocktakeUpdateValidation = [
  ...mongoIdParamValidation,
  body('lines').isArray({ min: 1 }).withMessage('lines is required'),
  body('lines.*.produceName').trim().notEmpty(),
  body('lines.*.produceType').trim().isIn(PRODUCE_TYPES),
  body('lines.*.countedKg')
    .optional({ values: 'null' })
    .custom((value) => value === null || value === '' || Number(value) >= 0)
    .withMessage('countedKg must be null or >= 0')
];

const taxConfigUpdateValidation = [
  body('companyName').optional().trim().isLength({ min: 2, max: 200 }),
  body('tin').optional().trim().isLength({ max: 40 }),
  body('invoicePreamble').optional().trim().isLength({ max: 500 }),
  body('vatRatePercent').optional().isFloat({ min: 0, max: 100 })
];

const cashUpOpenValidation = [
  body('businessDate')
    .optional()
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('businessDate must be YYYY-MM-DD'),
  body('branch').optional().trim().notEmpty()
];

const cashUpCloseValidation = [
  ...mongoIdParamValidation,
  body('countedTotals').optional().isObject(),
  body('countedTotals.cashUgx').optional().isFloat({ min: 0 }),
  body('countedTotals.momoUgx').optional().isFloat({ min: 0 }),
  body('countedTotals.bankUgx').optional().isFloat({ min: 0 }),
  body('cashUgx').optional().isFloat({ min: 0 }),
  body('momoUgx').optional().isFloat({ min: 0 }),
  body('bankUgx').optional().isFloat({ min: 0 }),
  body('varianceNote').optional().trim().isLength({ max: 500 })
];

const retentionUpdateValidation = [
  body('auditLogDays').optional().isInt({ min: 30 }),
  body('messageOutboxDays').optional().isInt({ min: 30 }),
  body('stockNotificationDays').optional().isInt({ min: 30 }),
  body('anonymizeBuyerAfterDays').optional().isInt({ min: 30 })
];

const glExportQueryValidation = [
  query('from').notEmpty().withMessage('from is required').isISO8601(),
  query('to').notEmpty().withMessage('to is required').isISO8601(),
  query('branch').optional().trim().notEmpty(),
  query('format').optional().trim().isIn(['json', 'csv'])
];

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const writeOffDecisionValidation = [
  ...mongoIdParamValidation,
  body('note').optional().trim().isLength({ max: 500 }).withMessage('note must be at most 500 characters')
];

const periodLockValidation = [
  body('scope').optional().trim().notEmpty().isLength({ max: 60 }),
  body('lockedThrough')
    .custom((value) => value === null || ISO_DATE_ONLY.test(String(value)))
    .withMessage('lockedThrough must be YYYY-MM-DD, or null to reopen'),
  body('note').optional().trim().isLength({ max: 500 })
];

const statementQueryValidation = [
  ...mongoIdParamValidation,
  query('from').optional().matches(ISO_DATE_ONLY).withMessage('from must be YYYY-MM-DD'),
  query('to').optional().matches(ISO_DATE_ONLY).withMessage('to must be YYYY-MM-DD'),
  query('format').optional().isIn(['json', 'pdf'])
];

const statementEmailValidation = [
  ...mongoIdParamValidation,
  body('from').optional().matches(ISO_DATE_ONLY).withMessage('from must be YYYY-MM-DD'),
  body('to').optional().matches(ISO_DATE_ONLY).withMessage('to must be YYYY-MM-DD')
];

const apiKeyCreateValidation = [
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 120 }),
  body('scopes')
    .isArray({ min: 1, max: API_KEY_SCOPES.length })
    .withMessage('scopes must be a non-empty array')
    .custom((scopes) => scopes.every((scope) => API_KEY_SCOPES.includes(scope)))
    .withMessage(`scopes must be one of: ${API_KEY_SCOPES.join(', ')}`),
  body('branch').optional({ values: 'null' }).trim().isLength({ max: 60 }),
  body('expiresAt').optional({ values: 'falsy' }).isISO8601().withMessage('expiresAt must be an ISO date')
];

const WEBHOOK_URL_OPTIONS = {
  require_protocol: true,
  protocols: ['http', 'https'],
  require_tld: false
};

const webhookEventsRule = () =>
  body('events')
    .optional()
    .isArray({ min: 1, max: WEBHOOK_EVENTS.length })
    .withMessage('events must be a non-empty array')
    .custom((events) => events.every((event) => WEBHOOK_EVENTS.includes(event)))
    .withMessage(`events must be one of: ${WEBHOOK_EVENTS.join(', ')}`);

const webhookCreateValidation = [
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 120 }),
  body('targetUrl')
    .trim()
    .notEmpty()
    .withMessage('targetUrl is required')
    .isLength({ max: 500 })
    .isURL(WEBHOOK_URL_OPTIONS)
    .withMessage('targetUrl must be a valid http(s) URL'),
  webhookEventsRule(),
  body('secret').optional().trim().isLength({ min: 16, max: 128 }),
  body('isActive').optional().isBoolean().toBoolean()
];

const webhookUpdateValidation = [
  ...mongoIdParamValidation,
  body('name').optional().trim().isLength({ min: 1, max: 120 }),
  body('targetUrl')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .isURL(WEBHOOK_URL_OPTIONS)
    .withMessage('targetUrl must be a valid http(s) URL'),
  webhookEventsRule(),
  body('isActive').optional().isBoolean().toBoolean(),
  body('rotateSecret').optional().isBoolean().toBoolean()
];

const webhookDeliveryListValidation = [
  query('status').optional().isIn(['queued', 'retrying', 'delivered', 'failed']),
  query('subscriptionId').optional().isMongoId(),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt()
];

const webhookTestEmitValidation = [
  body('event')
    .optional()
    .isIn(WEBHOOK_EVENTS)
    .withMessage(`event must be one of: ${WEBHOOK_EVENTS.join(', ')}`),
  body('payload').optional().isObject()
];

const platformJobEnqueueValidation = [
  body('jobName').trim().notEmpty().withMessage('jobName is required')
];

// Configure price create validation.
const priceCreateValidation = [
  body('produceName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: VALIDATION_LIMITS.textMinLength })
    .withMessage(`produceName must be at least ${VALIDATION_LIMITS.textMinLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('produceName must be alphanumeric'),
  body('produceType').trim().isIn(PRODUCE_TYPES).withMessage('Invalid produceType'),
  body('priceUgx')
    .isFloat({ min: VALIDATION_LIMITS.moneyMinUgx })
    .withMessage(`priceUgx must be at least ${VALIDATION_LIMITS.moneyMinUgx}`)
];

// Configure price update validation.
const priceUpdateValidation = [
  ...mongoIdParamValidation,
  body('produceName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: VALIDATION_LIMITS.textMinLength })
    .withMessage(`produceName must be at least ${VALIDATION_LIMITS.textMinLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('produceName must be alphanumeric'),
  body('produceType').optional().trim().isIn(PRODUCE_TYPES).withMessage('Invalid produceType'),
  body('priceUgx')
    .optional()
    .isFloat({ min: VALIDATION_LIMITS.moneyMinUgx })
    .withMessage(`priceUgx must be at least ${VALIDATION_LIMITS.moneyMinUgx}`)
];

const passwordResetValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('username is required')
    .isLength({ min: 2 })
    .withMessage('username must be at least 2 characters'),
  body('recoveryCode').trim().notEmpty().withMessage('recoveryCode is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('newPassword is required')
    .isLength({ min: 10 })
    .withMessage('newPassword must be at least 10 characters')
    .matches(PASSWORD_COMPLEXITY_PATTERN)
    .withMessage('newPassword must include uppercase, lowercase, number, and symbol')
];

const mfaCodeValidation = [
  body('code').trim().matches(/^\d{6}$/).withMessage('code must be a 6-digit authenticator value'),
  body('mfaToken').optional().isString()
];

const mfaDisableValidation = [
  body('password').notEmpty().withMessage('password is required'),
  body('code').optional().trim().matches(/^\d{6}$/).withMessage('code must be a 6-digit authenticator value')
];

const mfaLoginValidation = [
  body('mfaToken').notEmpty().withMessage('mfaToken is required'),
  body('code').trim().matches(/^\d{6}$/).withMessage('code must be a 6-digit authenticator value'),
  body('rememberMe').optional().isBoolean().withMessage('rememberMe must be true or false')
];

export {
  mongoIdParamValidation,
  paginationValidation,
  loginValidation,
  registerValidation,
  profileUpdateValidation,
  userUpdateValidation,
  procurementCreateValidation,
  procurementUpdateValidation,
  saleCreateValidation,
  saleUpdateValidation,
  creditSaleCreateValidation,
  creditSaleUpdateValidation,
  creditPaymentStatusValidation,
  creditRepaymentValidation,
  trustedBuyerCreateValidation,
  trustedBuyerUpdateValidation,
  supplierCreateValidation,
  supplierUpdateValidation,
  voidReasonValidation,
  transferCreateValidation,
  adjustmentCreateValidation,
  stocktakeUpdateValidation,
  taxConfigUpdateValidation,
  cashUpOpenValidation,
  cashUpCloseValidation,
  retentionUpdateValidation,
  glExportQueryValidation,
  writeOffDecisionValidation,
  periodLockValidation,
  statementQueryValidation,
  statementEmailValidation,
  apiKeyCreateValidation,
  webhookCreateValidation,
  webhookUpdateValidation,
  webhookDeliveryListValidation,
  webhookTestEmitValidation,
  platformJobEnqueueValidation,
  priceCreateValidation,
  priceUpdateValidation,
  passwordResetValidation,
  mfaCodeValidation,
  mfaDisableValidation,
  mfaLoginValidation
};