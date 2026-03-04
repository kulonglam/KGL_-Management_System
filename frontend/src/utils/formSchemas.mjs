/** Composed validation schemas for procurement, sales, credit-sale, and buyer-facing forms. */
import { validators as v } from './formValidation.mjs';

const PRODUCE_TYPES = ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans'];
const SOURCE_TYPES = ['individual', 'company', 'kgl_farm'];
const ALPHANUMERIC_TEXT = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;
const PHONE_PATTERN = /^(\+256|0)[0-9]{9}$/;
const NIN_PATTERN = /^[A-Za-z0-9]{14}$/;

const procurementValidationSchema = {
  produceName: [
    v.required('Produce name is required.'),
    v.minLength(2, 'Produce name must be at least 2 characters.'),
    v.pattern(ALPHANUMERIC_TEXT, 'Produce name must be alphanumeric.')
  ],
  produceType: [
    v.required('Produce type is required.'),
    v.oneOf(PRODUCE_TYPES, 'Invalid produce type.')
  ],
  sourceType: [v.required('Source type is required.'), v.oneOf(SOURCE_TYPES, 'Invalid source type.')],
  dateReceived: [v.required('Date received is required.'), v.isoDate('Date received must be valid.')],
  timeReceived: [v.required('Time received is required.'), v.timeHHmm()],
  // Individual suppliers have a higher minimum tonnage requirement than other source types.
  tonnageKg: (values) => [
    v.required('Tonnage is required.'),
    v.number('Tonnage must be numeric.'),
    v.minValue(
      values?.sourceType === 'individual' ? 1000 : 100,
      values?.sourceType === 'individual'
        ? 'Tonnage must be at least 1000 kg for individual dealers.'
        : 'Tonnage must be at least 100 kg.'
    )
  ],
  costUgx: [
    v.required('Cost is required.'),
    v.number('Cost must be numeric.'),
    v.minValue(10000, 'Cost must be at least 10000 UGX.')
  ],
  sellingPrice: [
    v.required('Selling price is required.'),
    v.number('Selling price must be numeric.'),
    v.minValue(10000, 'Selling price must be at least 10000 UGX.')
  ],
  dealerName: [
    v.required('Dealer name is required.'),
    v.minLength(2, 'Dealer name must be at least 2 characters.'),
    v.pattern(ALPHANUMERIC_TEXT, 'Dealer name must be alphanumeric.')
  ],
  dealerContact: [
    v.required('Dealer contact is required.'),
    v.pattern(PHONE_PATTERN, 'Dealer contact must be a valid Ugandan phone number.')
  ]
};

const salesValidationSchema = {
  produceName: [
    v.required('Produce name is required.'),
    v.minLength(2, 'Produce name must be at least 2 characters.'),
    v.pattern(ALPHANUMERIC_TEXT, 'Produce name must be alphanumeric.')
  ],
  tonnageKg: [
    v.required('Tonnage is required.'),
    v.number('Tonnage must be numeric.'),
    v.minValue(1, 'Tonnage must be at least 1 kg.')
  ],
  amountPaidUgx: [
    v.required('Amount paid is required.'),
    v.number('Amount paid must be numeric.'),
    v.minValue(10000, 'Amount paid must be at least 10000 UGX.')
  ],
  buyerName: [
    v.required('Buyer name is required.'),
    v.minLength(2, 'Buyer name must be at least 2 characters.'),
    v.pattern(ALPHANUMERIC_TEXT, 'Buyer name must be alphanumeric.')
  ],
  date: [v.required('Date is required.'), v.isoDate('Date must be valid.')],
  time: [v.required('Time is required.'), v.timeHHmm()]
};

const creditSaleValidationSchema = {
  trustedBuyerId: [
    v.required('Trusted buyer is required.'),
    v.mongoId('Trusted buyer is invalid.')
  ],
  buyerName: [
    v.required('Buyer name is required.'),
    v.minLength(2, 'Buyer name must be at least 2 characters.'),
    v.pattern(ALPHANUMERIC_TEXT, 'Buyer name must be alphanumeric.')
  ],
  nationalId: [
    v.required('National ID is required.'),
    v.pattern(NIN_PATTERN, 'National ID must be a valid NIN.')
  ],
  location: [
    v.required('Location is required.'),
    v.minLength(2, 'Location must be at least 2 characters.'),
    v.pattern(ALPHANUMERIC_TEXT, 'Location must be alphanumeric.')
  ],
  contact: [
    v.required('Contact is required.'),
    v.pattern(PHONE_PATTERN, 'Contact must be a valid Ugandan phone number.')
  ],
  produceName: [
    v.required('Produce name is required.'),
    v.minLength(2, 'Produce name must be at least 2 characters.'),
    v.pattern(ALPHANUMERIC_TEXT, 'Produce name must be alphanumeric.')
  ],
  produceType: [
    v.required('Produce type is required.'),
    v.oneOf(PRODUCE_TYPES, 'Invalid produce type.')
  ],
  tonnageKg: [
    v.required('Tonnage is required.'),
    v.number('Tonnage must be numeric.'),
    v.minValue(1, 'Tonnage must be at least 1 kg.')
  ],
  amountDueUgx: [
    v.required('Amount due is required.'),
    v.number('Amount due must be numeric.'),
    v.minValue(10000, 'Amount due must be at least 10000 UGX.')
  ],
  dueDate: [
    v.required('Due date is required.'),
    v.isoDate('Due date must be valid.'),
    v.notPastDate('Due date must be today or a future date.')
  ],
  dateOfDispatch: [
    v.required('Date of dispatch is required.'),
    v.isoDate('Date of dispatch must be valid.')
  ]
};

const trustedBuyerValidationSchema = {
  name: [
    v.required('Buyer name is required.'),
    v.minLength(2, 'Buyer name must be at least 2 characters.'),
    v.pattern(ALPHANUMERIC_TEXT, 'Buyer name must be alphanumeric.')
  ],
  nationalId: [
    v.required('National ID is required.'),
    v.pattern(NIN_PATTERN, 'National ID must be a valid NIN.')
  ],
  location: [
    v.required('Location is required.'),
    v.minLength(2, 'Location must be at least 2 characters.'),
    v.pattern(ALPHANUMERIC_TEXT, 'Location must be alphanumeric.')
  ],
  contact: [
    v.required('Contact is required.'),
    v.pattern(PHONE_PATTERN, 'Contact must be a valid Ugandan phone number.')
  ]
};

export {
  procurementValidationSchema,
  salesValidationSchema,
  creditSaleValidationSchema,
  trustedBuyerValidationSchema
};

