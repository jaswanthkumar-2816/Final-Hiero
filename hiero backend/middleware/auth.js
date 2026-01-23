import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[AUTH] No token provided for', req.method, req.originalUrl);
    }
    return res.status(401).json({ error: 'Access denied: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Normalized user identity (some controllers expect req.userId, some may expect req.user.id)
    req.userId = decoded.userId || decoded.id;
    req.user = { id: req.userId }; // compatibility
    next();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[AUTH] Invalid token for', req.method, req.originalUrl, err.message);
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export default auth;