import mongoose from 'mongoose';

const TokenBalanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    tokenType: {
        type: String,
        required: true,
        enum: ['CC', 'SWP', 'REWARD_POINT', 'BITSAFE'],
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound index to ensure one balance record per user per token type
TokenBalanceSchema.index({ userId: 1, tokenType: 1 }, { unique: true });

// Update timestamp on save
TokenBalanceSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.models.TokenBalance || mongoose.model('TokenBalance', TokenBalanceSchema);
