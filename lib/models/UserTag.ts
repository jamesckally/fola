import mongoose from 'mongoose';

const UserTagSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    tagName: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[a-z0-9_]+$/,
        minlength: 3,
        maxlength: 20,
    },
    transactionHash: {
        type: String,
        required: false,
    },
    countdownEndDate: {
        type: Date,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.UserTag || mongoose.model('UserTag', UserTagSchema);
