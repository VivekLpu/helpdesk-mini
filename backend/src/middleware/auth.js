const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: {
          code: "AUTH_REQUIRED",
          message: "Access token is required"
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired token"
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired token"
      }
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "You don't have permission to perform this action"
        }
      });
    }
    next();
  };
};

module.exports = { auth, authorize };