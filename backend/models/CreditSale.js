import mongoose from 'mongoose';

const normalizeProduceType = (value) => {
  if (typeof value !== 'string') return value;

  const canonicalMap = {
    beans: 'Beans',
    'grain maize': 'Grain Maize',
    'cow peas': 'Cow peas',
    'g-nuts': 'G-nuts',
    soybeans: 'Soybeans'
  };

  const normalized = value
    // Normalize unicode dash variants to ASCII hyphen.
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  return canonicalMap[normalized.toLowerCase()] || normalized;
};

const creditSaleSchema = new mongoose.Schema(
  {
    buyerName: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/,},
    nationalId: { type: String, required: true, match: /^[A-Z0-9]{14}$/,},
    location: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/,},
    contact: { type: String, required: true, match: /^(\+256|0)[0-9]{9}$/,},
    amountDueUgx: { type: Number, required: true, min: 10000, },
    amountPaidUgx: { type: Number, default: 0, min: 0,},
    balanceUgx: { type: Number, default: function () {
       return this.amountDueUgx;
      }, min: 0,
    },
    salesAgentName: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/,},
    dueDate: { type: Date, required: true,},
    produceName: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/,},
    produceType: {
      type: String,
      required: true,
      minlength: 2,
      set: normalizeProduceType,
      enum: ["Beans", "Grain Maize", "Cow peas", "G-nuts", "Soybeans"]
    },
    tonnageKg: { type: Number, required: true, min: 1,},
    dateOfDispatch: { type: Date, required: true,}, 
    branch: { type: String, required: true, enum: ["Maganjo", "Matugga"],},
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true,},
    trustedBuyer: { type: mongoose.Schema.Types.ObjectId, ref: "TrustedBuyer",
      required: true,},
    isPaid: { type: Boolean, default: false,},
    payments: [  { amountUgx: { type: Number, required: true, min: 1,},
        paidAt: {type: Date, default: Date.now, },
        receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User",
          required: true,        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

creditSaleSchema.index({ branch: 1, createdAt: -1 });
creditSaleSchema.index({ branch: 1, dateOfDispatch: -1 });
creditSaleSchema.index({ branch: 1, dueDate: 1, isPaid: 1 });
creditSaleSchema.index({ trustedBuyer: 1, createdAt: -1 });

export default mongoose.model("CreditSale", creditSaleSchema);
