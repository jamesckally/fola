import mongoose from 'mongoose';

const USDTTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['DEPOSIT', 'WITHDRAWAL', 'TAG_PURCHASE', 'SPIN', 'REFERRAL_BONUS', 'SPIN_WIN'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    balanceBefore: {
        type: Number,
        required: true,
    },
    balanceAfter: {
        type: Number,
        required: true,
    },
    txHash: {
        type: String,
        sparse: true,
        index: true,
    },
    toAddress: {
        type: String,
        default: null,
    },
    fromAddress: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'COMPLETED',
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for efficient queries
USDTTransactionSchema.index({ userId: 1, createdAt: -1 });
USDTTransactionSchema.index({ type: 1, status: 1 });

export default mongoose.models.USDTTransaction || mongoose.model('USDTTransaction', USDTTransactionSchema);
