/**
 * HIERO PRODUCTION BOOTLOADER
 * Manually verifies and binds session/analytics dependencies
 */
console.log('🚀 HIERO BOOTLOADER: Initializing environment...');

try {
    const cp = require('cookie-parser');
    console.log('✅ Dependencies: Session Hub found.');
} catch (e) {
    console.warn('⚠️ Standard lookup failed. Attempting relative bind...');
    try {
        const cp = require('./node_modules/cookie-parser');
        console.log('✅ Dependencies: Session Hub bound via relative path.');
    } catch (e2) {
        console.error('❌ CRITICAL: Session Hub (cookie-parser) is missing. Run npm install.');
        process.exit(1);
    }
}

// Launch Gateway
console.log('📡 Launching Unified Gateway...');
require('./gateway.js');
