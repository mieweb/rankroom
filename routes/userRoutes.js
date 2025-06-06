const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
  try {
    // Check if email filter is provided
    if (req.query.email) {
      const users = await User.find({ email: req.query.email }).populate('topics', 'name description');
      return res.status(200).json(users);
    }
    
    const users = await User.find().populate('topics', 'name description');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('topics', 'name description');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    const user = new User({
      name,
      email,
      topics: [] // Initialize with empty topics array
    });
    
    const savedUser = await user.save();
    
    // Make sure we return the full user object
    const populatedUser = await User.findById(savedUser._id).populate('topics', 'name description');
    
    res.status(201).json(populatedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Update a user
router.patch('/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Check if another user already has this email
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Another user with this email already exists' });
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove user from topic participants
    // This would require importing the Topic model
    // We'll leave this for now to avoid circular dependencies
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all topics for a user
router.get('/:id/topics', async (req, res) => {
  try {
    console.log(`Getting topics for user ID: ${req.params.id}`);
    const user = await User.findById(req.params.id).populate('topics');
    
    if (!user) {
      console.log(`User not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`Found ${user.topics.length} topics for user:`, user.topics.map(t => t.name));
    res.status(200).json(user.topics);
  } catch (error) {
    console.error('Error getting topics for user:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
