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
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    internalCredited: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'FAILED'],
        default: 'PENDING'
    },
    verifiedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);
