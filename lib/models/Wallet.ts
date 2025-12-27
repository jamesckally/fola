import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    encryptedSeed: {
        type: String,
        required: true,
    },
    publicAddress: {
        type: String,
        required: true,
        unique: true,
    },
    phraseLength: {
        type: Number,
        required: true,
        default: 12,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    // Internal Ledger Fields
    internalBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    rewardPoints: {
        type: Number,
        default: 150,
        min: 0
    },
    usdtBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    fakeAddress: {
        type: String,
        unique: true,
        sparse: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes are automatically created for unique fields

export default mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);
