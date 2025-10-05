const express = require('express');
const Ticket = require('../models/Ticket');
const { auth, authorize } = require('../middleware/auth');
const { validateTicket } = require('../middleware/validation');
const idempotency = require('../middleware/idempotency');
const router = express.Router();

// Helper function to calculate SLA deadline
const calculateSLADeadline = (priority) => {
  const now = new Date();
  const slaHours = {
    low: 72,
    medium: 48,
    high: 24,
    urgent: 4
  };
  return new Date(now.getTime() + slaHours[priority] * 60 * 60 * 1000);
};

// Create ticket
// Create ticket
router.post('/', auth, idempotency, validateTicket, async (req, res) => {
  try {
    console.log('Creating ticket with data:', req.body);
    console.log('User creating ticket:', req.user);
    
    const { title, description, priority, category, tags } = req.body;

    const ticket = new Ticket({
      title,
      description,
      priority,
      category,
      requester: req.user._id,
      slaDeadline: calculateSLADeadline(priority),
      tags: tags || []
    });

    await ticket.save();
    await ticket.populate('requester', 'username firstName lastName email');

    console.log('Ticket created successfully:', ticket);

    res.status(201).json({
      message: "Ticket created successfully",
      ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    
    // If it's a validation error, send more details
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.log('Validation errors:', errors);
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: errors
        }
      });
    }
    
    // Log the full error
    console.error('Full error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: {
        code: "CREATE_TICKET_ERROR",
        message: "Failed to create ticket: " + error.message
      }
    });
  }
});

// Get tickets with pagination and filtering
// Get tickets with pagination and filtering
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching tickets with query:', req.query);
    console.log('User role:', req.user.role);
    
    const {
      limit = 10,
      offset = 0,
      status,
      priority,
      category,
      assignee,
      requester,
      q,
      slaBreached
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignee) query.assignee = assignee;
    if (requester) query.requester = requester;
    if (slaBreached === 'true') query.slaBreached = true;
    
    // Role-based filtering
    if (req.user.role === 'user') {
      query.requester = req.user._id;
    }

    // Search functionality
    if (q) {
      query.$text = { $search: q };
    }

    console.log('Final query:', query);

    const tickets = await Ticket.find(query)
      .populate('requester', 'username firstName lastName email')
      .populate('assignee', 'username firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Ticket.countDocuments(query);
    const nextOffset = parseInt(offset) + parseInt(limit);
    const hasMore = nextOffset < total;

    console.log('Found tickets:', tickets.length);
    console.log('Total tickets:', total);

    res.json({
      items: tickets,
      total,
      next_offset: hasMore ? nextOffset : null,
      has_more: hasMore
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      error: {
        code: "GET_TICKETS_ERROR",
        message: "Failed to retrieve tickets: " + error.message
      }
    });
  }
});
// Get single ticket
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('requester', 'username firstName lastName email')
      .populate('assignee', 'username firstName lastName email')
      .populate('comments.author', 'username firstName lastName');

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found"
        }
      });
    }

    // Check permissions
    if (req.user.role === 'user' && ticket.requester._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: {
          code: "ACCESS_DENIED",
          message: "You don't have permission to view this ticket"
        }
      });
    }

    // Check SLA
    ticket.checkSLA();
    await ticket.save();

    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      error: {
        code: "GET_TICKET_ERROR",
        message: "Failed to retrieve ticket"
      }
    });
  }
});

// Update ticket (with optimistic locking)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status, assignee, priority, version } = req.body;
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found"
        }
      });
    }

    // Check permissions
    if (req.user.role === 'user' && ticket.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: {
          code: "ACCESS_DENIED",
          message: "You don't have permission to update this ticket"
        }
      });
    }

    // Optimistic locking check
    if (version !== undefined && ticket.version !== version) {
      return res.status(409).json({
        error: {
          code: "STALE_DATA",
          message: "Ticket has been modified by another user"
        }
      });
    }

    // Update fields
    if (status) ticket.status = status;
    if (assignee) ticket.assignee = assignee;
    if (priority) {
      ticket.priority = priority;
      ticket.slaDeadline = calculateSLADeadline(priority);
    }

    // Set resolved timestamp
    if (status === 'resolved' && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();
    await ticket.populate('requester', 'username firstName lastName email');
    await ticket.populate('assignee', 'username firstName lastName email');

    res.json({
      message: "Ticket updated successfully",
      ticket
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({
      error: {
        code: "UPDATE_TICKET_ERROR",
        message: "Failed to update ticket"
      }
    });
  }
});

// Add comment to ticket
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content, isInternal } = req.body;
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found"
        }
      });
    }

    // Check permissions
    if (req.user.role === 'user' && ticket.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: {
          code: "ACCESS_DENIED",
          message: "You don't have permission to comment on this ticket"
        }
      });
    }

    // Add comment
    const comment = {
      author: req.user._id,
      content,
      isInternal: isInternal || false
    };

    ticket.comments.push(comment);
    await ticket.save();
    await ticket.populate('comments.author', 'username firstName lastName');

    res.status(201).json({
      message: "Comment added successfully",
      comment: ticket.comments[ticket.comments.length - 1]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      error: {
        code: "ADD_COMMENT_ERROR",
        message: "Failed to add comment"
      }
    });
  }
});

module.exports = router;