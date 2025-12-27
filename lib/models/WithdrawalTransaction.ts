import mongoose from 'mongoose';

const WithdrawalTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    gasFee: {
        type: Number,
        required: true,
        min: 0,
    },
    netAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    network: {
        type: String,
        enum: ['polygon', 'bsc'],
        required: true,
    },
    toAddress: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
    },
    transactionHash: {
        type: String,
        default: null,
    },
    errorMessage: {
        type: String,
        default: null,
    },
    ipAddress: {
        type: String,
        default: null,
    },
    userAgent: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});

// Indexes for efficient queries and rate limiting
WithdrawalTransactionSchema.index({ userId: 1, createdAt: -1 });
WithdrawalTransactionSchema.index({ userId: 1, status: 1 });
WithdrawalTransactionSchema.index({ createdAt: -1 });

export default mongoose.models.WithdrawalTransaction || mongoose.model('WithdrawalTransaction', WithdrawalTransactionSchema);
