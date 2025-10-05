const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all agents (for assignment)
router.get('/agents', auth, authorize('agent', 'admin'), async (req, res) => {
  try {
    const agents = await User.find({ role: { $in: ['agent', 'admin'] }, isActive: true })
      .select('username firstName lastName email')
      .sort({ firstName: 1, lastName: 1 });

    res.json({ agents });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      error: {
        code: "GET_AGENTS_ERROR",
        message: "Failed to retrieve agents"
      }
    });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: {
        code: "GET_PROFILE_ERROR",
        message: "Failed to retrieve profile"
      }
    });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('avatar')
    .optional()
    .trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: errors.array().map(error => ({
            field: error.path,
            message: error.msg
          }))
        }
      });
    }

    const { firstName, lastName, email, avatar } = req.body;
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: {
            code: "EMAIL_EXISTS",
            message: "Email is already in use"
          }
        });
      }
      updateData.email = email;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: {
        code: "UPDATE_PROFILE_ERROR",
        message: "Failed to update profile"
      }
    });
  }
});

// Change password
router.put('/profile/password', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your new password')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: errors.array().map(error => ({
            field: error.path,
            message: error.msg
          }))
        }
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: {
          code: "PASSWORD_MISMATCH",
          message: "New passwords do not match"
        }
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: "INVALID_PASSWORD",
          message: "Current password is incorrect"
        }
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: {
        code: "CHANGE_PASSWORD_ERROR",
        message: "Failed to change password"
      }
    });
  }
});

module.exports = router;