import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';

export const verifyToken = (req, res, next) => {
  // Check for token in cookies (for web) or Authorization header (for API)
  const token = req.cookies.access_token || 
               (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return next(errorHandler(401, 'No authentication token, authorization denied'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Make sure we have a user ID in the decoded token
    if (!decoded.id) {
      console.error('No user ID in token');
      return next(errorHandler(401, 'Invalid token format'));
    }
    
    // Set the user ID in the request object
    req.user = { _id: decoded.id };
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return next(errorHandler(401, 'Token expired, please log in again'));
    } else if (err.name === 'JsonWebTokenError') {
      return next(errorHandler(401, 'Invalid token, please log in again'));
    }
    return next(errorHandler(500, 'Server error during authentication'));
  }
};
