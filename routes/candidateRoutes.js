const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const Topic = require('../models/Topic');
const User = require('../models/User');

// Get all candidates for a topic
router.get('/topic/:topicId', async (req, res) => {
  try {
    const candidates = await Candidate.find({ topic: req.params.topicId })
      .populate('createdBy', 'name email');
    
    res.status(200).json(candidates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single candidate
router.get('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('topic');
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    res.status(200).json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new candidate
router.post('/', async (req, res) => {
  try {
    const { name, description, topicId, userId } = req.body;
    
    if (!name || !topicId || !userId) {
      return res.status(400).json({ message: 'Name, topicId, and userId are required' });
    }
    
    // Check if topic exists and is in the correct phase
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    if (topic.currentPhase < 2) {
      return res.status(400).json({ message: 'Topic must be in phase 2 (Collection) or higher to add candidates' });
    }
    
    // Check if user exists and is a participant in the topic
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!topic.participants.includes(userId)) {
      return res.status(400).json({ message: 'User is not a participant in this topic' });
    }
    
    const candidate = new Candidate({
      name,
      description,
      topic: topicId,
      createdBy: userId
    });
    
    const savedCandidate = await candidate.save();
    res.status(201).json(savedCandidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a candidate
router.patch('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    
    if (!updatedCandidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    res.status(200).json(updatedCandidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a candidate
router.delete('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    // Check if topic is in correct phase
    const topic = await Topic.findById(candidate.topic);
    if (topic && topic.currentPhase > 2) {
      return res.status(400).json({ message: 'Cannot delete candidates after phase 2 (Collection)' });
    }
    
    await Candidate.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
