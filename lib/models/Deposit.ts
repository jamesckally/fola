import mongoose from 'mongoose';

const DepositSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    txHash: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    network: {
        type: String,
        enum: ['polygon', 'bsc'],
        required: true
    },
    fromAddress: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    blockNumber: {
        type: Number,
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'failed'],
        default: 'pending'
    },
    verifiedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);
