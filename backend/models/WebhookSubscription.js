import mongoose from 'mongoose';

const WEBHOOK_EVENTS = [
  'sale.created',
  'sale.voided',
  'credit.overdue',
  'credit.created',
  'procurement.created',
  'retention.completed'
];

const webhookSubscriptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 120 },
    targetUrl: { type: String, required: true, maxlength: 500 },
    secret: { type: String, required: true, maxlength: 128 },
    events: {
      type: [String],
      default: () => ['sale.created'],
      validate: {
        validator(values) {
          return Array.isArray(values) && values.every((value) => WEBHOOK_EVENTS.includes(value));
        },
        message: 'Invalid webhook event type'
      }
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastDeliveredAt: { type: Date, default: null },
    lastStatusCode: { type: Number, default: null },
    lastError: { type: String, default: '' }
  },
  { timestamps: true }
);

webhookSubscriptionSchema.index({ isActive: 1, events: 1 });

export { WEBHOOK_EVENTS };
export default mongoose.model('WebhookSubscription', webhookSubscriptionSchema);
