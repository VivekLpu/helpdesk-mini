const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
// Update this in server.js
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      // Add your production frontend URL here once you have it
      "https://your-frontend-url.onrender.com"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet());
// Update this line in server.js
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    // Add your production frontend URL here once you have it
    "https://your-frontend-url.onrender.com"
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMIT",
        message: "Too many requests, please try again later."
      }
    });
  }
});

app.use('/api/', limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/helpdesk-mini', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/tickets', require('./src/routes/tickets'));
app.use('/api/users', require('./src/routes/users'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Metadata endpoint
app.get('/api/_meta', (req, res) => {
  res.json({
    name: "HelpDesk Mini",
    version: "1.0.0",
    description: "A mini helpdesk system with SLA tracking",
    endpoints: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/tickets",
      "POST /api/tickets",
      "GET /api/tickets/:id",
      "PATCH /api/tickets/:id",
      "POST /api/tickets/:id/comments"
    ]
  });
});

// Hackathon manifest
app.get('/.well-known/hackathon.json', (req, res) => {
  res.json({
    "name": "HelpDesk Mini",
    "description": "Ticketing system with SLA tracking and role-based access",
    "version": "1.0.0",
    "author": "Your Name",
    "repository": "https://github.com/yourusername/helpdesk-mini",
    "license": "MIT"
  });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-ticket', (ticketId) => {
    socket.join(`ticket-${ticketId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong!"
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});