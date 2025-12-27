import mongoose from 'mongoose';

const SpinSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    cost: {
        type: Number,
        required: true,
        default: 0.50,
    },
    prize: {
        type: Number,
        required: true,
        default: 0,
    },
    result: {
        type: String,
        enum: ['LOSE', 'SMALL_WIN', 'MEDIUM_WIN', 'BIG_WIN', 'JACKPOT'],
        default: 'LOSE',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for user lookups and analytics
SpinSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Spin || mongoose.model('Spin', SpinSchema);
