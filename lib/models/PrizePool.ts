import mongoose from 'mongoose';

const PrizePoolSchema = new mongoose.Schema({
    balance: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    totalDeposited: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalPaidOut: {
        type: Number,
        default: 0,
        min: 0,
    },
    jackpotCap: {
        type: Number,
        default: 1000,
        min: 0,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Method to calculate current jackpot amount
PrizePoolSchema.methods.calculateJackpot = function () {
    // 20% of pool balance, no cap
    return this.balance * 0.20;
};

// Method to check if pool can afford a prize
PrizePoolSchema.methods.canAfford = function (amount: number) {
    return this.balance >= amount;
};

// Static method to get or create the singleton prize pool
PrizePoolSchema.statics.getInstance = async function () {
    let pool = await this.findOne();
    if (!pool) {
        // Start with $0 - pool grows from ticket purchases
        pool = await this.create({ balance: 0 });
    }
    return pool;
};

// TypeScript interface for the model
interface IPrizePoolModel extends mongoose.Model<any> {
    getInstance(): Promise<any>;
}

export default (mongoose.models.PrizePool as IPrizePoolModel) || mongoose.model<any, IPrizePoolModel>('PrizePool', PrizePoolSchema);
