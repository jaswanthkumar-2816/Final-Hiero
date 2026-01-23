// Test script to simulate getting a JWT token
// This will help us get a valid token for testing the resume builder

const jwt = require('jsonwebtoken');

// Create a test JWT token that matches what the auth server would create
const testUser = {
  userId: 1,
  name: 'Test User',
  email: 'test@example.com',
  picture: null
};

const JWT_SECRET = 'X7k9P!mQ2aL5vR8'; // From .env file

const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });

console.log('Generated Test JWT Token:');
console.log(token);
console.log('\nUser Data:');
console.log(JSON.stringify(testUser, null, 2));

// Test token verification
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('\nToken verification successful:');
  console.log(JSON.stringify(decoded, null, 2));
} catch (error) {
  console.log('\nToken verification failed:', error.message);
}
