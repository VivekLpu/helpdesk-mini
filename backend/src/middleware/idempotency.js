const { v4: uuidv4 } = require('uuid');

// Simple in-memory cache for idempotency
const idempotencyCache = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > 300000) { // 5 minutes
      idempotencyCache.delete(key);
    }
  }
}, 60000); // Check every minute

const idempotency = (req, res, next) => {
  if (req.method === 'POST') {
    const idempotencyKey = req.get('Idempotency-Key');
    
    if (!idempotencyKey) {
      return res.status(400).json({
        error: {
          code: "IDEMPOTENCY_KEY_REQUIRED",
          message: "Idempotency-Key header is required for POST requests"
        }
      });
    }

    const cachedResponse = idempotencyCache.get(idempotencyKey);
    if (cachedResponse) {
      return res.status(200).json(cachedResponse.data);
    }

    // Store the original res.json function
    const originalJson = res.json;
    
    // Override res.json to cache the response
    res.json = function(data) {
      idempotencyCache.set(idempotencyKey, {
        data: data,
        timestamp: Date.now()
      });
      return originalJson.call(this, data);
    };
  }
  
  next();
};

module.exports = idempotency;