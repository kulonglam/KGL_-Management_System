import mongoose from 'mongoose';

const webhookDeliverySchema = new mongoose.Schema(
  {
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'WebhookSubscription', required: true },
    event: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['queued', 'retrying', 'delivered', 'failed'],
      default: 'queued'
    },
    statusCode: { type: Number, default: null },
    attemptCount: { type: Number, default: 0 },
    responseBody: { type: String, default: '', maxlength: 1000 },
    error: { type: String, default: '', maxlength: 500 },
    deliveredAt: { type: Date, default: null }
  },
  { timestamps: true }
);

webhookDeliverySchema.index({ subscription: 1, createdAt: -1 });
webhookDeliverySchema.index({ event: 1, createdAt: -1 });
webhookDeliverySchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('WebhookDelivery', webhookDeliverySchema);
