import mongoose from 'mongoose';

/**
 * Check if an email is in the whitelist
 */
export async function isEmailWhitelisted(email: string): Promise<boolean> {
    try {
        const Whitelist = mongoose.models.Whitelist || mongoose.model('Whitelist', new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            addedAt: { type: Date, default: Date.now }
        }));

        const result = await Whitelist.findOne({ email: email.toLowerCase() });
        return !!result;
    } catch (error) {
        console.error('Error checking whitelist:', error);
        return false;
    }
}

/**
 * Add email to whitelist
 */
export async function addEmailToWhitelist(email: string): Promise<{ success: boolean; message: string }> {
    try {
        const Whitelist = mongoose.models.Whitelist || mongoose.model('Whitelist', new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            addedAt: { type: Date, default: Date.now }
        }));

        const emailLower = email.toLowerCase().trim();

        // Check if already exists
        const existing = await Whitelist.findOne({ email: emailLower });
        if (existing) {
            return { success: false, message: `${email} is already whitelisted` };
        }

        // Add to whitelist
        await Whitelist.create({ email: emailLower });
        return { success: true, message: `${email} added to whitelist successfully` };
    } catch (error) {
        console.error('Error adding to whitelist:', error);
        return { success: false, message: 'Failed to add email to whitelist' };
    }
}

/**
 * Get whitelist error message
 */
export function getWhitelistErrorMessage(): string {
    return "Sorry, your Gmail is not on the whitelist. You can contact Swapa support";
}
