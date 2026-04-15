/**
 * Hiero · Analytics Reset Script
 * Run: node reset-analytics.js
 * Clears the PageView collection so the dashboard starts from zero.
 */
const mongoose = require('mongoose');
const path     = require('path');
require('dotenv').config();
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.join(__dirname, 'login-system', '.env') });
}

async function reset() {
  console.log('⏳ Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected.\n');

  const dropped = [];

  // Clear PageViews
  if (mongoose.connection.db.collection('pageviews')) {
    await mongoose.connection.db.collection('pageviews').deleteMany({});
    dropped.push('pageviews');
  }

  console.log('🗑️  Cleared collections:', dropped.join(', ') || 'none found');
  console.log('\n✅ Analytics reset to zero. Dashboard will start fresh.\n');
  process.exit(0);
}

reset().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
