const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const seedUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/helpdesk-mini');
    
    // Clear existing users
    await User.deleteMany({});
    
    // Create users
    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      },
      {
        username: 'agent',
        email: 'agent@example.com',
        password: 'agent123',
        firstName: 'Agent',
        lastName: 'User',
        role: 'agent'
      },
      {
        username: 'user',
        email: 'user@example.com',
        password: 'user123',
        firstName: 'Regular',
        lastName: 'User',
        role: 'user'
      }
    ];
    
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.email}`);
    }
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedUsers();