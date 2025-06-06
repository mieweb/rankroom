const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const User = require('../models/User');

// Get all topics
router.get('/', async (req, res) => {
  try {
    const topics = await Topic.find().populate('participants', 'name email');
    res.status(200).json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single topic
router.get('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).populate('participants', 'name email');
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    res.status(200).json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new topic
router.post('/', async (req, res) => {
  try {
    const { name, description, userId } = req.body;
    
    if (!name || !userId) {
      return res.status(400).json({ message: 'Name and userId are required' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const topic = new Topic({
      name,
      description,
      participants: [userId]
    });
    
    const savedTopic = await topic.save();
    
    // Add topic to user's topics
    user.topics.push(savedTopic._id);
    await user.save();
    
    res.status(201).json(savedTopic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a topic
router.patch('/:id', async (req, res) => {
  try {
    const { name, description, currentPhase } = req.body;
    const updatedTopic = await Topic.findByIdAndUpdate(
      req.params.id,
      { 
        name: name,
        description: description,
        currentPhase: currentPhase
      },
      { new: true }
    );
    
    if (!updatedTopic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    res.status(200).json(updatedTopic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a participant to a topic
router.post('/:id/participants', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'UserId is required' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Check if user is already a participant
    if (topic.participants.includes(userId)) {
      return res.status(400).json({ message: 'User is already a participant' });
    }
    
    // Add user to topic participants
    topic.participants.push(userId);
    await topic.save();
    
    // Add topic to user's topics
    user.topics.push(topic._id);
    await user.save();
    
    res.status(200).json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a topic
router.delete('/:id', async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Remove topic from users' topics
    await User.updateMany(
      { topics: req.params.id },
      { $pull: { topics: req.params.id } }
    );
    
    res.status(200).json({ message: 'Topic deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update the phase of a topic
router.patch('/:id/phase', async (req, res) => {
  try {
    const { phase } = req.body;
    
    if (!phase || phase < 1 || phase > 3) {
      return res.status(400).json({ message: 'Valid phase (1-3) is required' });
    }
    
    const topic = await Topic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    topic.currentPhase = phase;
    await topic.save();
    
    res.status(200).json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
