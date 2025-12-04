import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { addEmailToWhitelist } from '@/lib/whitelist';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const filePath = path.join(process.cwd(), 'emails.txt');

        if (!fs.existsSync(filePath)) {
            return NextResponse.json(
                { error: 'emails.txt not found' },
                { status: 404 }
            );
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const emails = fileContent
            .split('\n')
            .map(e => e.trim())
            .filter(e => e && e.includes('@')); // Basic validation

        await dbConnect();

        let addedCount = 0;
        let errors = [];

        // Process in batches to avoid overwhelming the DB connection if list is huge
        // For 6000 emails, we might want to use insertMany with ordered: false for speed,
        // but let's stick to the helper for consistency unless it times out.
        // Actually, for 6000 items, one by one might be slow.
        // Let's do a bulk write for efficiency.

        const Whitelist = (await import('mongoose')).models.Whitelist || (await import('mongoose')).model('Whitelist');

        // Get all existing emails to filter out duplicates in memory first
        const existingDocs = await Whitelist.find({}, { email: 1 });
        const existingEmails = new Set(existingDocs.map((d: any) => d.email.toLowerCase()));

        const newEmails = emails.filter(email => !existingEmails.has(email.toLowerCase()));

        if (newEmails.length > 0) {
            const operations = newEmails.map(email => ({
                updateOne: {
                    filter: { email: email.toLowerCase() },
                    update: {
                        $setOnInsert: {
                            email: email.toLowerCase(),
                            addedAt: new Date()
                        }
                    },
                    upsert: true
                }
            }));

            const result = await Whitelist.bulkWrite(operations);
            addedCount = result.upsertedCount + result.modifiedCount; // Approximate
        }

        return NextResponse.json({
            success: true,
            message: `Sync complete. Processed ${emails.length} emails. Added ${newEmails.length} new emails.`,
            totalInFile: emails.length,
            newlyAdded: newEmails.length
        });

    } catch (error: any) {
        console.error('Error syncing whitelist:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to sync whitelist' },
            { status: 500 }
        );
    }
}
