/**
 * HIERO — MongoDB Connection
 * Single source of truth for database setup.
 */

const mongoose = require('mongoose');

async function connectDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.warn('⚠️  MONGODB_URI not set. Database features will use in-memory fallback.');
        return false;
    }

    try {
        mongoose.set('bufferCommands', true);
        await mongoose.connect(uri);
        console.log('✅ MongoDB connected');
        return true;
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        return false;
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});

module.exports = { connectDatabase };
