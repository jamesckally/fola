import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema({
    referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'EXPIRED'],
        default: 'PENDING',
    },
    bonusAmount: {
        type: Number,
        default: 1.00,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for efficient queries
ReferralSchema.index({ referrer: 1, status: 1 });
ReferralSchema.index({ candidate: 1 });

export default mongoose.models.Referral || mongoose.model('Referral', ReferralSchema);
