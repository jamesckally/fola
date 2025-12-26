import mongoose from 'mongoose';

const DepositMonitorSchema = new mongoose.Schema({
    network: {
        type: String,
        enum: ['polygon', 'bsc'],
        required: true,
        unique: true
    },
    lastCheckedBlock: {
        type: Number,
        required: true,
        default: 0
    },
    lastCheckedAt: {
        type: Date,
        default: Date.now
    },
    isRunning: {
        type: Boolean,
        default: false
    },
    totalDepositsProcessed: {
        type: Number,
        default: 0
    },
    lastError: {
        type: String,
        default: null
    }
});

export default mongoose.models.DepositMonitor || mongoose.model('DepositMonitor', DepositMonitorSchema);
