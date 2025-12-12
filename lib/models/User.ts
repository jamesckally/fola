import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    name: {
        type: String,
        trim: true,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    seedPhrase: {
        type: String,
        // In production, this should be encrypted
    },
    walletAddress: {
        type: String,
        unique: true,
        sparse: true,
    },
    isWhitelisted: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes are automatically created for unique fields

export default mongoose.models.User || mongoose.model('User', UserSchema);
