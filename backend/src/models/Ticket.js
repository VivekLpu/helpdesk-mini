const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  isInternal: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comments: [commentSchema],
  slaDeadline: {
    type: Date
  },
  slaBreached: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  version: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for search functionality
ticketSchema.index({
  title: 'text',
  description: 'text',
  'comments.content': 'text'
});

// Method to check SLA
ticketSchema.methods.checkSLA = function() {
  if (this.slaDeadline && new Date() > this.slaDeadline && this.status !== 'resolved' && this.status !== 'closed') {
    this.slaBreached = true;
    return true;
  }
  return false;
};

// Method to add version for optimistic locking
ticketSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);