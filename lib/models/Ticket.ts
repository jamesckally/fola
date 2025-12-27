import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    freeTickets: {
        type: Number,
        default: 0,
        min: 0,
    },
    paidTickets: {
        type: Number,
        default: 0,
        min: 0,
    },
    lastFreeTicketClaim: {
        type: Date,
        default: null,
    },
    totalTicketsPurchased: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalSpent: {
        type: Number,
        default: 0,
        min: 0,
    },
}, {
    timestamps: true,
});

// Single index for efficient user lookups (removed duplicate)
TicketSchema.index({ userId: 1 });

// Method to check if user can claim free ticket
TicketSchema.methods.canClaimFreeTicket = function () {
    if (!this.lastFreeTicketClaim) return true;

    const now = new Date();
    const lastClaim = new Date(this.lastFreeTicketClaim);
    const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastClaim >= 24;
};

// Method to get total tickets
TicketSchema.methods.getTotalTickets = function () {
    return this.freeTickets + this.paidTickets;
};

export default mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
