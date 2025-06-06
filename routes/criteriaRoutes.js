const express = require('express');
const router = express.Router();
const Criterion = require('../models/Criterion');
const Topic = require('../models/Topic');
const User = require('../models/User');

// Get all criteria for a topic
router.get('/topic/:topicId', async (req, res) => {
  try {
    const criteria = await Criterion.find({ topic: req.params.topicId })
      .populate('user', 'name email')
      .sort({ rank: -1 });
    
    res.status(200).json(criteria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get personal criteria for a user in a topic
router.get('/user/:userId/topic/:topicId', async (req, res) => {
  try {
    const criteria = await Criterion.find({ 
      user: req.params.userId,
      topic: req.params.topicId
    }).sort({ rank: -1 });
    
    res.status(200).json(criteria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get shared criteria for a topic
router.get('/shared/topic/:topicId', async (req, res) => {
  try {
    const criteria = await Criterion.find({ 
      topic: req.params.topicId,
      isShared: true
    }).populate('user', 'name email');
    
    res.status(200).json(criteria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new criterion
router.post('/', async (req, res) => {
  try {
    const { name, description, topicId, userId, isShared } = req.body;
    
    if (!name || !topicId || !userId) {
      return res.status(400).json({ message: 'Name, topicId, and userId are required' });
    }
    
    // Check if topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Check if user exists and is a participant in the topic
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!topic.participants.includes(userId)) {
      return res.status(400).json({ message: 'User is not a participant in this topic' });
    }
    
    // Get the count of existing criteria for this user in this topic to set the initial rank
    const criteriaCount = await Criterion.countDocuments({ 
      user: userId,
      topic: topicId
    });
    
    const criterion = new Criterion({
      name,
      description,
      topic: topicId,
      user: userId,
      rank: criteriaCount + 1, // Default rank is at the end
      isShared: !!isShared // Default is false if not provided
    });
    
    const savedCriterion = await criterion.save();
    res.status(201).json(savedCriterion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a criterion
router.patch('/:id', async (req, res) => {
  try {
    const { name, description, rank, isShared } = req.body;
    
    const updatedCriterion = await Criterion.findByIdAndUpdate(
      req.params.id,
      { 
        name,
        description,
        rank,
        isShared
      },
      { new: true }
    );
    
    if (!updatedCriterion) {
      return res.status(404).json({ message: 'Criterion not found' });
    }
    
    res.status(200).json(updatedCriterion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a criterion
router.delete('/:id', async (req, res) => {
  try {
    const criterion = await Criterion.findByIdAndDelete(req.params.id);
    
    if (!criterion) {
      return res.status(404).json({ message: 'Criterion not found' });
    }
    
    // Re-rank remaining criteria for this user in this topic
    const remainingCriteria = await Criterion.find({
      user: criterion.user,
      topic: criterion.topic,
      _id: { $ne: req.params.id }
    }).sort({ rank: 1 });
    
    for (let i = 0; i < remainingCriteria.length; i++) {
      remainingCriteria[i].rank = i + 1;
      await remainingCriteria[i].save();
    }
    
    res.status(200).json({ message: 'Criterion deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update the ranks of multiple criteria at once
router.post('/rank', async (req, res) => {
  try {
    const { rankings } = req.body;
    
    if (!rankings || !Array.isArray(rankings)) {
      return res.status(400).json({ message: 'Rankings array is required' });
    }
    
    for (const ranking of rankings) {
      if (!ranking.criterionId || !ranking.rank) {
        return res.status(400).json({ message: 'Each ranking must include criterionId and rank' });
      }
      
      await Criterion.findByIdAndUpdate(
        ranking.criterionId,
        { rank: ranking.rank }
      );
    }
    
    res.status(200).json({ message: 'Rankings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
