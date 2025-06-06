const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');
const Candidate = require('../models/Candidate');
const Criterion = require('../models/Criterion');
const Topic = require('../models/Topic');
const User = require('../models/User');
const CandidateRanking = require('../models/CandidateRanking');

// Get all evaluations for a user in a topic
router.get('/user/:userId/topic/:topicId', async (req, res) => {
  try {
    // First get all candidates for the topic
    const candidates = await Candidate.find({ topic: req.params.topicId });
    const candidateIds = candidates.map(c => c._id);
    
    // Get all criteria for the topic that the user has created
    const criteria = await Criterion.find({ 
      topic: req.params.topicId,
      user: req.params.userId
    });
    const criterionIds = criteria.map(c => c._id);
    
    // Now get all evaluations for these candidates and criteria
    const evaluations = await Evaluation.find({
      user: req.params.userId,
      candidate: { $in: candidateIds },
      criterion: { $in: criterionIds }
    }).populate('candidate').populate('criterion');
    
    res.status(200).json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all evaluations for a specific candidate and criterion
router.get('/candidate/:candidateId/criterion/:criterionId', async (req, res) => {
  try {
    const evaluations = await Evaluation.find({
      candidate: req.params.candidateId,
      criterion: req.params.criterionId
    }).populate('user', 'name email');
    
    res.status(200).json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update an evaluation
router.post('/', async (req, res) => {
  try {
    const { userId, candidateId, criterionId, score, notes } = req.body;
    
    if (!userId || !candidateId || !criterionId || score === undefined) {
      return res.status(400).json({ message: 'UserId, candidateId, criterionId, and score are required' });
    }
    
    // Validate the score
    if (score < 1 || score > 10) {
      return res.status(400).json({ message: 'Score must be between 1 and 10' });
    }
    
    // Check if candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    // Check if criterion exists
    const criterion = await Criterion.findById(criterionId);
    if (!criterion) {
      return res.status(404).json({ message: 'Criterion not found' });
    }
    
    // Check if user exists and is a participant in the topic
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get the topic to check the phase
    const topic = await Topic.findById(candidate.topic);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    if (!topic.participants.includes(userId)) {
      return res.status(400).json({ message: 'User is not a participant in this topic' });
    }
    
    if (topic.currentPhase < 2) {
      return res.status(400).json({ message: 'Topic must be in phase 2 (Collection) or higher to add evaluations' });
    }
    
    // Check if an evaluation already exists
    let evaluation = await Evaluation.findOne({
      user: userId,
      candidate: candidateId,
      criterion: criterionId
    });
    
    if (evaluation) {
      // Update existing evaluation
      evaluation.score = score;
      if (notes !== undefined) {
        evaluation.notes = notes;
      }
      await evaluation.save();
    } else {
      // Create new evaluation
      evaluation = new Evaluation({
        user: userId,
        candidate: candidateId,
        criterion: criterionId,
        score,
        notes
      });
      await evaluation.save();
    }
    
    res.status(201).json(evaluation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete an evaluation
router.delete('/:id', async (req, res) => {
  try {
    const evaluation = await Evaluation.findByIdAndDelete(req.params.id);
    
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    res.status(200).json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get aggregated scores for all candidates in a topic
router.get('/aggregated/topic/:topicId', async (req, res) => {
  try {
    // Get all candidates for the topic
    const candidates = await Candidate.find({ topic: req.params.topicId });
    
    // Get all shared criteria for the topic
    const sharedCriteria = await Criterion.find({
      topic: req.params.topicId,
      isShared: true
    });
    
    // Get all participants in the topic
    const topic = await Topic.findById(req.params.topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Build the results array
    const results = [];
    
    for (const candidate of candidates) {
      const candidateResult = {
        candidate: candidate,
        criteriaScores: [],
        averageScore: 0,
        scoreVariance: 0
      };
      
      let totalScore = 0;
      let scoreCount = 0;
      let allScores = [];
      
      for (const criterion of sharedCriteria) {
        // Get all evaluations for this candidate and criterion
        const evaluations = await Evaluation.find({
          candidate: candidate._id,
          criterion: criterion._id
        });
        
        // Calculate average score for this criterion
        const scores = evaluations.map(e => e.score);
        const averageScore = scores.length > 0 
          ? scores.reduce((a, b) => a + b, 0) / scores.length 
          : 0;
        
        // Calculate variance
        const variance = scores.length > 0
          ? scores.reduce((a, b) => a + Math.pow(b - averageScore, 2), 0) / scores.length
          : 0;
        
        candidateResult.criteriaScores.push({
          criterion: criterion,
          averageScore,
          variance,
          evaluationCount: scores.length
        });
        
        totalScore += averageScore;
        scoreCount += scores.length > 0 ? 1 : 0;
        allScores = allScores.concat(scores);
      }
      
      // Calculate overall average score
      candidateResult.averageScore = scoreCount > 0 
        ? totalScore / scoreCount 
        : 0;
      
      // Calculate overall variance
      const overallAverage = allScores.length > 0
        ? allScores.reduce((a, b) => a + b, 0) / allScores.length
        : 0;
      
      candidateResult.scoreVariance = allScores.length > 0
        ? allScores.reduce((a, b) => a + Math.pow(b - overallAverage, 2), 0) / allScores.length
        : 0;
      
      results.push(candidateResult);
    }
    
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update candidate rankings
router.post('/rankings', async (req, res) => {
  try {
    const { userId, topicId, rankings } = req.body;
    
    if (!userId || !topicId || !rankings || !Array.isArray(rankings)) {
      return res.status(400).json({ message: 'UserId, topicId, and rankings array are required' });
    }
    
    // Check if user exists and is a participant in the topic
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if topic exists and is in phase 3
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    if (!topic.participants.includes(userId)) {
      return res.status(400).json({ message: 'User is not a participant in this topic' });
    }
    
    if (topic.currentPhase < 3) {
      return res.status(400).json({ message: 'Topic must be in phase 3 (Decision) to rank candidates' });
    }
    
    // Check if the candidate IDs are valid
    for (const ranking of rankings) {
      if (!ranking.candidateId || ranking.rank === undefined) {
        return res.status(400).json({ message: 'Each ranking must include candidateId and rank' });
      }
      
      const candidate = await Candidate.findById(ranking.candidateId);
      if (!candidate || !candidate.topic.equals(topic._id)) {
        return res.status(400).json({ message: `Invalid candidate ID: ${ranking.candidateId}` });
      }
    }
    
    // Check if rankings already exist for this user and topic
    let candidateRanking = await CandidateRanking.findOne({
      user: userId,
      topic: topicId
    });
    
    if (candidateRanking) {
      // Update existing rankings
      candidateRanking.rankings = rankings.map(r => ({
        candidate: r.candidateId,
        rank: r.rank
      }));
      candidateRanking.updatedAt = Date.now();
      await candidateRanking.save();
    } else {
      // Create new rankings
      candidateRanking = new CandidateRanking({
        user: userId,
        topic: topicId,
        rankings: rankings.map(r => ({
          candidate: r.candidateId,
          rank: r.rank
        }))
      });
      await candidateRanking.save();
    }
    
    res.status(201).json(candidateRanking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get candidate rankings for a user in a topic
router.get('/rankings/user/:userId/topic/:topicId', async (req, res) => {
  try {
    const candidateRanking = await CandidateRanking.findOne({
      user: req.params.userId,
      topic: req.params.topicId
    }).populate({
      path: 'rankings.candidate',
      model: 'Candidate'
    });
    
    if (!candidateRanking) {
      return res.status(404).json({ message: 'No rankings found for this user and topic' });
    }
    
    res.status(200).json(candidateRanking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all candidate rankings for a topic
router.get('/rankings/topic/:topicId', async (req, res) => {
  try {
    const candidateRankings = await CandidateRanking.find({
      topic: req.params.topicId
    }).populate('user', 'name email').populate({
      path: 'rankings.candidate',
      model: 'Candidate'
    });
    
    res.status(200).json(candidateRankings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get discrepancies between rankings and evaluations
router.get('/discrepancies/topic/:topicId', async (req, res) => {
  try {
    // Get all candidates for the topic
    const candidates = await Candidate.find({ topic: req.params.topicId });
    
    // Get all shared criteria for the topic
    const sharedCriteria = await Criterion.find({
      topic: req.params.topicId,
      isShared: true
    });
    
    // Get all candidate rankings for the topic
    const candidateRankings = await CandidateRanking.find({
      topic: req.params.topicId
    }).populate('user');
    
    // Calculate scores for each candidate
    const candidateScores = {};
    
    for (const candidate of candidates) {
      let totalScore = 0;
      let count = 0;
      
      for (const criterion of sharedCriteria) {
        const evaluations = await Evaluation.find({
          candidate: candidate._id,
          criterion: criterion._id
        });
        
        if (evaluations.length > 0) {
          const avgScore = evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length;
          totalScore += avgScore;
          count++;
        }
      }
      
      candidateScores[candidate._id.toString()] = count > 0 ? totalScore / count : 0;
    }
    
    // Find discrepancies between rankings and scores
    const discrepancies = [];
    
    for (const ranking of candidateRankings) {
      const userDiscrepancies = {
        user: ranking.user,
        discrepancies: []
      };
      
      // Sort candidates by rank (lowest rank number = highest ranking)
      const sortedRankings = [...ranking.rankings].sort((a, b) => a.rank - b.rank);
      
      // Compare adjacent pairs of candidates
      for (let i = 0; i < sortedRankings.length - 1; i++) {
        const higherRankedCandidate = sortedRankings[i].candidate.toString();
        const lowerRankedCandidate = sortedRankings[i + 1].candidate.toString();
        
        // If the lower-ranked candidate has a significantly higher score, flag a discrepancy
        if (candidateScores[lowerRankedCandidate] > candidateScores[higherRankedCandidate] + 2) {
          userDiscrepancies.discrepancies.push({
            higherRankedCandidate,
            lowerRankedCandidate,
            scoreDifference: candidateScores[lowerRankedCandidate] - candidateScores[higherRankedCandidate]
          });
        }
      }
      
      if (userDiscrepancies.discrepancies.length > 0) {
        discrepancies.push(userDiscrepancies);
      }
    }
    
    res.status(200).json(discrepancies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
