import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true },
    address: String,
    hasPurchasedTag: { type: Boolean, default: false },
    tagName: String,
    rewardPoints: { type: Number, default: 0 },
    rewardCycleCount: { type: Number, default: 0 },
    lastDailyClaim: Date,
    dailySendCount: { type: Number, default: 0 },
    lastSendReset: Date,
    autoApproveEnabled: { type: Boolean, default: true },
    oneStepTransfers: { type: Boolean, default: true },
    utxoManagement: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

export async function claimDailyRP(userId: string) {
    const user = await User.findById(userId);
    if (user.rewardCycleCount < 5 && (!user.lastDailyClaim || Date.now() - user.lastDailyClaim.getTime() > 24 * 60 * 60 * 1000)) {
        user.rewardPoints += 25;
        user.lastDailyClaim = new Date();
        await user.save();
        return 25;
    }
    return 0;
}

export async function creditRPSend(userId: string) {
    const user = await User.findById(userId);
    if (user.hasPurchasedTag && user.dailySendCount < 5) {
        user.rewardPoints += 5;
        user.dailySendCount += 1;
        user.lastSendReset = new Date();
        await user.save();
        return 5;
    }
    return 0;
}

export async function convertRewards(userId: string) {
    const user = await User.findById(userId);
    user.rewardPoints = 0;
    user.rewardCycleCount = 0;
    user.lastDailyClaim = null;
    user.dailySendCount = 0;
    await user.save();
    return true;
}