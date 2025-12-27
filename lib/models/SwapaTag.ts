import mongoose from 'mongoose';

const SwapaTagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    price: {
        type: Number,
        required: true,
        default: 2.50,
    },
    purchasedAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for faster lookups
SwapaTagSchema.index({ owner: 1 });
SwapaTagSchema.index({ name: 1 });

export default mongoose.models.SwapaTag || mongoose.model('SwapaTag', SwapaTagSchema);
