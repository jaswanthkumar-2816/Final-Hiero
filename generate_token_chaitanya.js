const jwt = require('jsonwebtoken');

const token = jwt.sign({
  userId: 'chaitanya123', 
  username: 'chaitanya.reddy@email.com'
}, 'X7k9P!mQ2aL5vR8', { expiresIn: '1h' });

console.log('JWT Token for Chaitanya Reddy N:');
console.log(token);
