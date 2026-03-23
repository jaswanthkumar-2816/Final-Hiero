const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, 'login-system', '.env') });
console.log('Client ID from .env:', process.env.GOOGLE_CLIENT_ID);
