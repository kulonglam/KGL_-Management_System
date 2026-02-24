import { body, param, query } from 'express-validator';

const PRODUCE_TYPES = ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans'];
const SOURCE_TYPES = ['individual', 'company', 'own_farm'];
const ROLES = ['director', 'manager', 'sales_agent'];
const BRANCHES = ['Maganjo', 'Matugga'];
const ALPHANUMERIC_TEXT = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;
const PHONE_PATTERN = /^(\+256|0)[0-9]{9}$/;
const NIN_PATTERN = /^[A-Z0-9]{14}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const mongoIdParamValidation = [
  param('id').isMongoId().withMessage('Invalid id')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('limit must be between 1 and 200')
];

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
  body('role')
    .trim()
    .isIn(ROLES)
    .withMessage('Invalid role'),
  body('branch')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(BRANCHES)
    .withMessage('Invalid branch')
];

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
  body('role')
    .optional()
    .trim()
    .isIn(ROLES)
    .withMessage('Invalid role'),
  body('branch')
    .optional()
    .trim()
    .isIn(BRANCHES)
    .withMessage('Invalid branch'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters')
];

const procurementCreateValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('name is required')
    .isLength({ min: 2 })
    .withMessage('name must be at least 2 characters')
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('name must be alphanumeric'),
  body('type')
    .trim()
    .isIn(PRODUCE_TYPES)
    .withMessage('Invalid produce type'),
  body('sourceType')
    .trim()
    .isIn(SOURCE_TYPES)
    .withMessage('Invalid source type'),
  body('dateReceived')
    .isISO8601()
    .withMessage('dateReceived must be a valid date'),
  body('timeReceived')
    .matches(TIME_PATTERN)
    .withMessage('timeReceived must be in HH:mm format'),
  body('tonnageKg')
    .isFloat({ gt: 0 })
    .withMessage('tonnageKg must be greater than 0'),
  body('costUgx')
    .isFloat({ min: 10000 })
    .withMessage('costUgx must be at least 10000'),
  body('dealerName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('dealerName must be at least 2 characters')
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('dealerName must be alphanumeric'),
  body('dealerContact')
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage('dealerContact must be a valid Ugandan phone number'),
  body('sellingPrice')
    .optional()
    .isFloat({ min: 10000 })
    .withMessage('sellingPrice must be at least 10000')
];

const procurementUpdateValidation = [
  ...mongoIdParamValidation,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('name must be at least 2 characters')
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('name must be alphanumeric'),
  body('type')
    .optional()
    .trim()
    .isIn(PRODUCE_TYPES)
    .withMessage('Invalid produce type'),
  body('sourceType')
    .optional()
    .trim()
    .isIn(SOURCE_TYPES)
    .withMessage('Invalid source type'),
  body('dateReceived')
    .optional()
    .isISO8601()
    .withMessage('dateReceived must be a valid date'),
  body('timeReceived')
    .optional()
    .matches(TIME_PATTERN)
    .withMessage('timeReceived must be in HH:mm format'),
  body('tonnageKg')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('tonnageKg must be greater than 0'),
  body('costUgx')
    .optional()
    .isFloat({ min: 10000 })
    .withMessage('costUgx must be at least 10000'),
  body('dealerName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('dealerName must be at least 2 characters')
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('dealerName must be alphanumeric'),
  body('dealerContact')
    .optional()
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage('dealerContact must be a valid Ugandan phone number'),
  body('sellingPrice')
    .optional()
    .isFloat({ min: 10000 })
    .withMessage('sellingPrice must be at least 10000')
];

const saleCreateValidation = [
  body('produceName')
    .trim()
    .notEmpty()
    .withMessage('produceName is required')
    .isLength({ min: 2 })
    .withMessage('produceName must be at least 2 characters')
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('produceName must be alphanumeric'),
  body('produceType')
    .optional()
    .trim()
    .isIn(PRODUCE_TYPES)
    .withMessage('Invalid produceType'),
  body('tonnageKg')
    .isFloat({ gt: 0 })
    .withMessage('tonnageKg must be greater than 0'),
  body('buyerName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('buyerName must be at least 2 characters')
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('buyerName must be alphanumeric'),
  body('date')
    .isISO8601()
    .withMessage('date must be a valid date'),
  body('time')
    .matches(TIME_PATTERN)
    .withMessage('time must be in HH:mm format')
];

const creditSaleCreateValidation = [
  body('trustedBuyerId')
    .isMongoId()
    .withMessage('trustedBuyerId is required'),
  body('dueDate')
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
    .isISO8601()
    .withMessage('dateOfDispatch must be a valid date'),
  body('produceName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('produceName must be at least 2 characters')
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('produceName must be alphanumeric'),
  body('produceType')
    .optional()
    .trim()
    .isIn(PRODUCE_TYPES)
    .withMessage('Invalid produceType'),
  body('tonnageKg')
    .isFloat({ gt: 0 })
    .withMessage('tonnageKg must be greater than 0')
];

const creditPaymentStatusValidation = [
  ...mongoIdParamValidation,
  body('isPaid')
    .isBoolean()
    .withMessage('isPaid must be a boolean')
];

const creditRepaymentValidation = [
  ...mongoIdParamValidation,
  body('amountUgx')
    .isFloat({ gt: 0 })
    .withMessage('amountUgx must be greater than 0'),
  body('paidAt')
    .optional()
    .isISO8601()
    .withMessage('paidAt must be a valid date')
];

const trustedBuyerCreateValidation = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('name must be at least 2 characters')
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('name must be alphanumeric'),
  body('nationalId')
    .trim()
    .toUpperCase()
    .matches(NIN_PATTERN)
    .withMessage('nationalId must be a valid NIN'),
  body('location')
    .trim()
    .isLength({ min: 2 })
    .withMessage('location must be at least 2 characters')
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('location must be alphanumeric'),
  body('contact')
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage('contact must be a valid Ugandan phone number')
];

const trustedBuyerUpdateValidation = [
  ...mongoIdParamValidation,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('name must be at least 2 characters')
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
    .isLength({ min: 2 })
    .withMessage('location must be at least 2 characters')
    .matches(ALPHANUMERIC_TEXT)
    .withMessage('location must be alphanumeric'),
  body('contact')
    .optional()
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage('contact must be a valid Ugandan phone number')
];

const priceCreateValidation = [
  body('produceType')
    .trim()
    .isIn(PRODUCE_TYPES)
    .withMessage('Invalid produceType'),
  body('priceUgx')
    .isFloat({ min: 10000 })
    .withMessage('priceUgx must be at least 10000')
];

const priceUpdateValidation = [
  ...mongoIdParamValidation,
  body('produceType')
    .optional()
    .trim()
    .isIn(PRODUCE_TYPES)
    .withMessage('Invalid produceType'),
  body('priceUgx')
    .optional()
    .isFloat({ min: 10000 })
    .withMessage('priceUgx must be at least 10000')
];

const stockCheckValidation = [
  body('produceName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('produceName is required'),
  body('tonnage')
    .isFloat({ gt: 0 })
    .withMessage('tonnage must be greater than 0')
];

const notificationReadValidation = [
  ...mongoIdParamValidation
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
  creditSaleCreateValidation,
  creditPaymentStatusValidation,
  creditRepaymentValidation,
  trustedBuyerCreateValidation,
  trustedBuyerUpdateValidation,
  priceCreateValidation,
  priceUpdateValidation,
  stockCheckValidation,
  notificationReadValidation
};
