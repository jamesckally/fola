import mongoose from 'mongoose';

const SpinTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    ticketType: {
        type: String,
        enum: ['free', 'paid'],
        required: true,
    },
    prizeAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    prizeType: {
        type: String,
        enum: ['normal', 'jackpot'],
        default: 'normal',
    },
    poolBalanceBefore: {
        type: Number,
        required: true,
    },
    poolBalanceAfter: {
        type: Number,
        required: true,
    },
    wasDowngraded: {
        type: Boolean,
        default: false,
    },
    originalPrize: {
        type: Number,
        default: null,
    },
    result: {
        type: String,
        enum: ['LOSE', 'SMALL_WIN', 'MEDIUM_WIN', 'BIG_WIN', 'JACKPOT', 'FREE_SPIN'],
        required: true,
    },
    transactionHash: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});

// Indexes for efficient queries
SpinTransactionSchema.index({ userId: 1, createdAt: -1 });
SpinTransactionSchema.index({ createdAt: -1 });

export default mongoose.models.SpinTransaction || mongoose.model('SpinTransaction', SpinTransactionSchema);
