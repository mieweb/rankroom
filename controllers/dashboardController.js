const Topic = require('../models/Topic');
const User = require('../models/User');
const Criterion = require('../models/Criterion');
const Candidate = require('../models/Candidate');

// Get dashboard data for a user
exports.getUserDashboard = async (userId) => {
  try {
    // Get user with populated topics
    const user = await User.findById(userId).populate('topics');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const dashboard = {
      user,
      topics: []
    };
    
    // Get detailed info for each topic
    for (const topic of user.topics) {
      const topicDetail = {
        ...topic._doc,
        criteriaCount: 0,
        candidatesCount: 0,
        evaluationsComplete: false
      };
      
      // Count criteria for this user in this topic
      const criteriaCount = await Criterion.countDocuments({
        user: userId,
        topic: topic._id
      });
      
      topicDetail.criteriaCount = criteriaCount;
      
      // Count candidates in this topic
      const candidatesCount = await Candidate.countDocuments({
        topic: topic._id
      });
      
      topicDetail.candidatesCount = candidatesCount;
      
      // Check if all evaluations are complete for this user
      // This is a simplification - in a real app you'd check if each candidate
      // has been evaluated against each criterion by this user
      topicDetail.evaluationsComplete = criteriaCount > 0 && candidatesCount > 0;
      
      dashboard.topics.push(topicDetail);
    }
    
    return dashboard;
  } catch (error) {
    throw error;
  }
};

// Get topic summary data
exports.getTopicSummary = async (topicId) => {
  try {
    const topic = await Topic.findById(topicId).populate('participants');
    
    if (!topic) {
      throw new Error('Topic not found');
    }
    
    const summary = {
      topic,
      participantCount: topic.participants.length,
      criteriaCount: 0,
      sharedCriteriaCount: 0,
      candidateCount: 0,
      phaseComplete: false
    };
    
    // Count all criteria for this topic
    const criteriaCount = await Criterion.countDocuments({
      topic: topicId
    });
    
    summary.criteriaCount = criteriaCount;
    
    // Count shared criteria for this topic
    const sharedCriteriaCount = await Criterion.countDocuments({
      topic: topicId,
      isShared: true
    });
    
    summary.sharedCriteriaCount = sharedCriteriaCount;
    
    // Count candidates for this topic
    const candidateCount = await Candidate.countDocuments({
      topic: topicId
    });
    
    summary.candidateCount = candidateCount;
    
    // Determine if the current phase is complete
    if (topic.currentPhase === 1) {
      // Definition phase is complete if all participants have at least one criterion
      let allParticipantsHaveCriteria = true;
      
      for (const participant of topic.participants) {
        const userCriteriaCount = await Criterion.countDocuments({
          topic: topicId,
          user: participant._id
        });
        
        if (userCriteriaCount === 0) {
          allParticipantsHaveCriteria = false;
          break;
        }
      }
      
      summary.phaseComplete = allParticipantsHaveCriteria && sharedCriteriaCount > 0;
    } else if (topic.currentPhase === 2) {
      // Collection phase is complete if there's at least one candidate
      // and each participant has evaluated each candidate on their criteria
      summary.phaseComplete = candidateCount > 0;
      
      // This is a simplification - in a real app you'd check if all evaluations are done
    } else if (topic.currentPhase === 3) {
      // Decision phase is complete when all participants have ranked candidates
      // This is a simplification
      summary.phaseComplete = false;
    }
    
    return summary;
  } catch (error) {
    throw error;
  }
};

// Suggest new criteria based on scoring anomalies
exports.suggestNewCriteria = async (topicId) => {
  try {
    // This is a placeholder for a real implementation
    // In a real app, you would analyze the evaluations and suggest new criteria
    // based on patterns in the data
    
    const suggestedCriteria = [
      {
        name: 'Cost efficiency',
        description: 'How cost-efficient is this option in the long term',
        reason: 'Candidates with good long-term value are ranked highly despite lower scores on immediate cost'
      },
      {
        name: 'Team preference',
        description: 'Overall team preference based on informal feedback',
        reason: 'There are consistent ranking discrepancies that suggest unstated preferences'
      },
      {
        name: 'Implementation complexity',
        description: 'How complex would implementation be',
        reason: 'Candidates with simpler implementation are ranked higher despite lower feature scores'
      }
    ];
    
    return suggestedCriteria;
  } catch (error) {
    throw error;
  }
};
