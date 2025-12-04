const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const addToWhitelist = async () => {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Please provide emails or a file path.');
        console.log('Usage 1: node scripts/add-to-whitelist.js email1@gmail.com email2@gmail.com');
        console.log('Usage 2: node scripts/add-to-whitelist.js emails.txt');
        process.exit(1);
    }

    let emails = [];

    // Check if first argument is a file
    if (args.length === 1 && fs.existsSync(args[0])) {
        const filePath = args[0];
        console.log(`Reading emails from file: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf-8');

        if (filePath.endsWith('.json')) {
            try {
                emails = JSON.parse(content);
                if (!Array.isArray(emails)) throw new Error('JSON must be an array of strings');
            } catch (e) {
                console.error('Invalid JSON file:', e.message);
                process.exit(1);
            }
        } else {
            // Assume text file, one email per line
            emails = content.split(/\r?\n/).map(line => line.trim()).filter(line => line);
        }
    } else {
        emails = args;
    }

    console.log(`Found ${emails.length} emails to process.`);

    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not defined in .env.local');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const WhitelistSchema = new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            addedAt: { type: Date, default: Date.now }
        });

        const Whitelist = mongoose.models.Whitelist || mongoose.model('Whitelist', WhitelistSchema);

        let added = 0;
        let skipped = 0;
        let failed = 0;

        // Process in chunks of 100 to avoid overwhelming the connection but faster than serial
        const chunkSize = 100;
        for (let i = 0; i < emails.length; i += chunkSize) {
            const chunk = emails.slice(i, i + chunkSize);
            await Promise.all(chunk.map(async (email) => {
                const normalizedEmail = email.toLowerCase().trim();
                if (!normalizedEmail) return;

                try {
                    // Use updateOne with upsert to be more efficient and atomic
                    const result = await Whitelist.updateOne(
                        { email: normalizedEmail },
                        { $setOnInsert: { email: normalizedEmail, addedAt: new Date() } },
                        { upsert: true }
                    );

                    if (result.upsertedCount > 0) {
                        added++;
                    } else {
                        skipped++;
                    }
                } catch (err) {
                    console.error(`[ERROR] Failed to add ${normalizedEmail}:`, err.message);
                    failed++;
                }
            }));

            // Progress log
            if ((i + chunkSize) % 1000 === 0 || (i + chunkSize) >= emails.length) {
                console.log(`Processed ${Math.min(i + chunkSize, emails.length)}/${emails.length}...`);
            }
        }

        console.log('\n--- Summary ---');
        console.log(`Total: ${emails.length}`);
        console.log(`Added: ${added}`);
        console.log(`Skipped (Already existed): ${skipped}`);
        console.log(`Failed: ${failed}`);

    } catch (error) {
        console.error('Database connection error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

addToWhitelist();
