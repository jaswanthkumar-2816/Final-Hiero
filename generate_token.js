const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 'chaitanyaUser123' }, 'X7k9P!mQ2aL5vR8', { expiresIn: '1h' });
console.log(token);
