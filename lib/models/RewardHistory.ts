import mongoose from 'mongoose';

const RewardHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD format for easy daily querying
        required: true
    },
    transferCount: {
        type: Number,
        default: 0
    },
    pointsEarned: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure one record per user per day
RewardHistorySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.RewardHistory || mongoose.model('RewardHistory', RewardHistorySchema);
