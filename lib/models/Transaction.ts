import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['DEPOSIT', 'TRANSFER', 'TAG_PURCHASE', 'REWARD_CONVERSION'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    fromAddress: {
        type: String, // Internal fake address
        required: false
    },
    toAddress: {
        type: String, // Internal fake address
        required: false
    },
    txHash: {
        type: String, // For external deposits or just a unique internal ID
        required: false
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'COMPLETED'
    },
    description: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
