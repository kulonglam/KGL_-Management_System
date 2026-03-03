import { body, param, query } from 'express-validator';

// Configure produce types.
const PRODUCE_TYPES = ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans'];
// Configure source types.
const SOURCE_TYPES = ['individual', 'company', 'kgl_farm'];
// Configure branches.
const BRANCHES = ['Maganjo', 'Matugga'];
// Configure alphanumeric text.
const ALPHANUMERIC_TEXT = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;
// Configure phone pattern.
const PHONE_PATTERN = /^(\+256|0)[0-9]{9}$/;
// Configure nin pattern.
const NIN_PATTERN = /^[A-Z0-9]{14}$/;
// Configure time pattern.
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
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
    sellingPrice: { min: VALIDATION_LIMITS.moneyMinUgx },
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

// Configure roles.
const ROLES = ['director', 'manager', 'sales_agent'];
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
    .withMessage('limit must be between 1 and 200')
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
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters')
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
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters'),
  body('role').trim().isIn(ROLES).withMessage('Invalid role'),
  body('branch').optional({ values: 'falsy' }).trim().isIn(BRANCHES).withMessage('Invalid branch')
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
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters')
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
  body('branch').optional().trim().isIn(BRANCHES).withMessage('Invalid branch'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters')
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
  body('sellingPrice')
    .notEmpty()
    .withMessage('sellingPrice is required')
    .isFloat({ min: procurementRules.sellingPrice.min })
    .withMessage(`sellingPrice must be at least ${procurementRules.sellingPrice.min}`),
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
    .notEmpty()
    .withMessage('dealerContact is required')
    .matches(PHONE_PATTERN)
    .withMessage('dealerContact must be a valid Ugandan phone number')
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
  body('sellingPrice')
    .optional()
    .isFloat({ min: procurementRules.sellingPrice.min })
    .withMessage(`sellingPrice must be at least ${procurementRules.sellingPrice.min}`),
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
    .matches(PHONE_PATTERN)
    .withMessage('dealerContact must be a valid Ugandan phone number')
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
    .withMessage('time must be in HH:mm format')
];

// Configure sale update validation (manager correction fields only).
const saleUpdateValidation = [
  ...mongoIdParamValidation,
  body('buyerName')
    .optional()
    .trim()
    .isLength({ min: saleRules.buyerName.minLength })
    .withMessage(`buyerName must be at least ${saleRules.buyerName.minLength} characters`)
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('buyerName must be alphanumeric'),
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
    .withMessage('dueDate must be a valid date')
    .custom((value) => {
      const dueDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);

      if (Number.isNaN(dueDate.getTime()) || dueDate < today) {
        throw new Error('dueDate must be today or a future date');
      }

      return true;
    }),
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
    .withMessage('dueDate must be a valid date')
    .custom((value) => {
      const dueDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      if (Number.isNaN(dueDate.getTime()) || dueDate < today) {
        throw new Error('dueDate must be today or a future date');
      }
      return true;
    }),
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
  body('amountUgx').isFloat({ gt: 0 }).withMessage('amountUgx must be greater than 0'),
  body('paidAt').optional().isISO8601().withMessage('paidAt must be a valid date')
];

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
    .notEmpty()
    .withMessage('contact is required')
    .matches(PHONE_PATTERN)
    .withMessage('contact must be a valid Ugandan phone number')
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
    .matches(PHONE_PATTERN)
    .withMessage('contact must be a valid Ugandan phone number')
];

// Configure price create validation.
const priceCreateValidation = [
  body('produceType').trim().isIn(PRODUCE_TYPES).withMessage('Invalid produceType'),
  body('priceUgx')
    .isFloat({ min: VALIDATION_LIMITS.moneyMinUgx })
    .withMessage(`priceUgx must be at least ${VALIDATION_LIMITS.moneyMinUgx}`)
];

// Configure price update validation.
const priceUpdateValidation = [
  ...mongoIdParamValidation,
  body('produceType').optional().trim().isIn(PRODUCE_TYPES).withMessage('Invalid produceType'),
  body('priceUgx')
    .optional()
    .isFloat({ min: VALIDATION_LIMITS.moneyMinUgx })
    .withMessage(`priceUgx must be at least ${VALIDATION_LIMITS.moneyMinUgx}`)
];

// Configure stock check validation.
const stockCheckValidation = [
  body('produceName')
    .trim()
    .isLength({ min: VALIDATION_LIMITS.textMinLength })
    .withMessage('produceName is required'),
  body('tonnage').isFloat({ gt: 0 }).withMessage('tonnage must be greater than 0')
];

// Configure notification read validation.
const notificationReadValidation = [...mongoIdParamValidation];

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
  priceCreateValidation,
  priceUpdateValidation,
  stockCheckValidation,
  notificationReadValidation
};
