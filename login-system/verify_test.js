const jwt = require("jsonwebtoken");
const token = jwt.sign({ 
  email: "jaswanth@example.com", 
  userId: 1 
}, "X7k9P!mQ2aL5vR8", { expiresIn: "1h" });
console.log(`http://localhost:3000/verify-email?token=${token}`);
