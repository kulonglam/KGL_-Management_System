// Composed client-side validation schemas for procurement, sales, credit-sale, and trusted-buyer forms.

import { validators as v } from './formValidation.js';
import { LOCAL_PHONE_PATTERN } from './phoneNumber.js';
import {
  alphaNumericMessage,
  invalidValueMessage,
  localPhoneMessage,
  minLengthMessage,
  minValueMessage,
  ninMessage,
  requiredMessage,
  validDateMessage,
  validNumberMessage,
  validTimeMessage
} from './validationMessages.js';

// Allowed lookup values shared between form widgets and validation rules.
const PRODUCE_TYPES = ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans'];
const SOURCE_TYPES = ['individual', 'company', 'kgl_farm'];
const ALPHANUMERIC_TEXT = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;
const PHONE_PATTERN = LOCAL_PHONE_PATTERN;
const NIN_PATTERN = /^(CM|CF)[0-9]{12}$/;

// Procurement entry rules, including source-dependent minimum tonnage policy.
const procurementValidationSchema = {
  produceName: [
    v.required(requiredMessage('Produce Name')),
    v.minLength(2, minLengthMessage('Produce Name', 2)),
    v.pattern(ALPHANUMERIC_TEXT, alphaNumericMessage('Produce Name'))
  ],
  produceType: [
    v.required(requiredMessage('Produce Type')),
    v.oneOf(PRODUCE_TYPES, invalidValueMessage('Produce Type'))
  ],
  sourceType: [
    v.required(requiredMessage('Source Type')),
    v.oneOf(SOURCE_TYPES, invalidValueMessage('Source Type'))
  ],
  dateReceived: [
    v.required(requiredMessage('Date')),
    v.isoDate(validDateMessage('Date'))
  ],
  timeReceived: [
    v.required(requiredMessage('Time')),
    v.timeHHmm(validTimeMessage('Time'))
  ],
  // Individual suppliers have a higher minimum tonnage requirement than other source types.
  tonnageKg: (values) => [
    v.required(requiredMessage('Tonnage (kg)')),
    v.number(validNumberMessage('Tonnage (kg)')),
    v.minValue(
      values?.sourceType === 'individual' ? 1000 : 100,
      minValueMessage('Tonnage (kg)', values?.sourceType === 'individual' ? 1000 : 100)
    )
  ],
  costUgx: [
    v.required(requiredMessage('Cost (UGX)')),
    v.number(validNumberMessage('Cost (UGX)')),
    v.minValue(10000, minValueMessage('Cost (UGX)', 10000))
  ],
  sellingPrice: [
    v.custom(
      (value) => Number.isFinite(Number(value)) && Number(value) >= 10000,
      'Managed selling price is required. Set it in Price Management.'
    )
  ],
  dealerName: [
    v.required(requiredMessage('Dealer Name')),
    v.minLength(2, minLengthMessage('Dealer Name', 2)),
    v.pattern(ALPHANUMERIC_TEXT, alphaNumericMessage('Dealer Name'))
  ],
  dealerContact: [
    v.required(requiredMessage('Dealer Contact')),
    v.pattern(PHONE_PATTERN, localPhoneMessage('Dealer Contact'))
  ]
};

// Cash-sales entry rules.
const salesValidationSchema = {
  produceName: [
    v.required(requiredMessage('Produce Name')),
    v.minLength(2, minLengthMessage('Produce Name', 2)),
    v.pattern(ALPHANUMERIC_TEXT, alphaNumericMessage('Produce Name'))
  ],
  tonnageKg: [
    v.required(requiredMessage('Tonnage (kg)')),
    v.number(validNumberMessage('Tonnage (kg)')),
    v.minValue(1, minValueMessage('Tonnage (kg)', 1))
  ],
  buyerName: [
    v.required(requiredMessage('Buyer Name')),
    v.minLength(2, minLengthMessage('Buyer Name', 2)),
    v.pattern(ALPHANUMERIC_TEXT, alphaNumericMessage('Buyer Name'))
  ],
  date: [v.required(requiredMessage('Date')), v.isoDate(validDateMessage('Date'))],
  time: [v.required(requiredMessage('Time')), v.timeHHmm(validTimeMessage('Time'))]
};

// Credit-sale dispatch rules: trusted buyer is selected by ID and amount/buyer details are system-filled.
const creditSaleValidationSchema = {
  trustedBuyerId: [
    v.required(requiredMessage('Trusted Buyer')),
    v.mongoId(invalidValueMessage('Trusted Buyer'))
  ],
  produceName: [
    v.required(requiredMessage('Produce Name')),
    v.minLength(2, minLengthMessage('Produce Name', 2)),
    v.pattern(ALPHANUMERIC_TEXT, alphaNumericMessage('Produce Name'))
  ],
  produceType: [
    v.required(requiredMessage('Produce Type')),
    v.oneOf(PRODUCE_TYPES, invalidValueMessage('Produce Type'))
  ],
  tonnageKg: [
    v.required(requiredMessage('Tonnage (kg)')),
    v.number(validNumberMessage('Tonnage (kg)')),
    v.minValue(1, minValueMessage('Tonnage (kg)', 1))
  ],
  dueDate: [
    v.required(requiredMessage('Due Date')),
    v.isoDate(validDateMessage('Due Date'))
  ],
  dateOfDispatch: [
    v.required(requiredMessage('Date of Dispatch')),
    v.isoDate(validDateMessage('Date of Dispatch'))
  ]
};

// Trusted-buyer registration/update rules.
const trustedBuyerValidationSchema = {
  name: [
    v.required(requiredMessage('Buyer Name')),
    v.minLength(2, minLengthMessage('Buyer Name', 2)),
    v.pattern(ALPHANUMERIC_TEXT, alphaNumericMessage('Buyer Name'))
  ],
  nationalId: [
    v.required(requiredMessage('National ID')),
    v.pattern(NIN_PATTERN, ninMessage('National ID'))
  ],
  location: [
    v.required(requiredMessage('Location')),
    v.minLength(2, minLengthMessage('Location', 2)),
    v.pattern(ALPHANUMERIC_TEXT, alphaNumericMessage('Location'))
  ],
  contact: [
    v.required(requiredMessage('Contact')),
    v.pattern(PHONE_PATTERN, localPhoneMessage('Contact'))
  ]
};

export {
  procurementValidationSchema,
  salesValidationSchema,
  creditSaleValidationSchema,
  trustedBuyerValidationSchema
};

