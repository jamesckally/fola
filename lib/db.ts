import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
    );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
declare global {
    var mongoose: {
        conn: any;
        promise: Promise<any> | null;
    };
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts)
            .then((mongoose) => {
                console.log('✅ MongoDB connected successfully');
                return mongoose;
            })
            .catch((error) => {
                console.error('❌ MongoDB connection error:', error.message);

                // Provide helpful error messages
                if (error.message.includes('ECONNREFUSED')) {
                    console.error('💡 Possible fixes:');
                    console.error('   1. Check if your MongoDB Atlas cluster is running (not paused)');
                    console.error('   2. Verify your IP is whitelisted in Network Access');
                    console.error('   3. Check your MONGODB_URI in .env.local');
                    console.error('   4. Ensure you have internet connectivity');
                }

                throw error;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;