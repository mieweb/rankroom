import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { Topics, Criteria, Candidates, Evaluations, Users } from './collections.js';

Meteor.methods({
  // Create a new user
  'users.create'(userData) {
    check(userData, {
      name: String,
      email: String
    });

    // Check if user already exists by email
    const existingUser = Users.findOne({ email: userData.email });
    if (existingUser) {
      return { success: true, userId: existingUser._id };
    }

    const userId = Random.id();
    
    const user = {
      _id: userId,
      name: userData.name,
      email: userData.email,
      topics: [],
      createdAt: new Date()
    };

    Users.insert(user);
    
    return { success: true, userId: userId };
  },

  // Create a new topic (3-phase decision-making)
  'topics.create'(topicData) {
    check(topicData, {
      name: String,
      description: Match.Optional(String),
      userId: String,
      settings: Match.Optional(Object)
    });

    // Verify user exists
    const user = Users.findOne(topicData.userId);
    if (!user) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }

    const topicId = Random.id();
    
    const topic = {
      _id: topicId,
      name: topicData.name,
      description: topicData.description || '',
      currentPhase: 1, // Start in Definition phase
      createdBy: topicData.userId,
      participants: [topicData.userId],
      settings: {
        allowCriteriaCollaboration: true,
        hideEvaluationsDuringCollection: true,
        ...(topicData.settings || {})
      },
      createdAt: new Date()
    };

    Topics.insert(topic);
    
    // Add topic to user's topics
    Users.update(topicData.userId, {
      $addToSet: { topics: topicId }
    });
    
    return {
      topicId: topicId,
      topicUrl: `/topic/${topicId}`,
      success: true
    };
  },

  // Join a topic
  'topics.join'(topicId, userId) {
    check(topicId, String);
    check(userId, String);

    const topic = Topics.findOne(topicId);
    if (!topic) {
      throw new Meteor.Error('topic-not-found', 'Topic not found');
    }

    const user = Users.findOne(userId);
    if (!user) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }

    // Add user to topic participants
    if (!topic.participants.includes(userId)) {
      Topics.update(topicId, {
        $addToSet: { participants: userId }
      });
    }

    // Add topic to user's topics
    if (!user.topics.includes(topicId)) {
      Users.update(userId, {
        $addToSet: { topics: topicId }
      });
    }

    return { success: true };
  },

  // Advance topic phase (room leader only)
  'topics.advancePhase'(topicId, newPhase, userId) {
    check(topicId, String);
    check(newPhase, Number);
    check(userId, String);

    const topic = Topics.findOne(topicId);
    if (!topic) {
      throw new Meteor.Error('topic-not-found', 'Topic not found');
    }

    // Check if user is the room leader
    if (topic.createdBy !== userId) {
      throw new Meteor.Error('not-authorized', 'Only the room leader can advance phases');
    }

    // Validate phase progression
    if (newPhase <= topic.currentPhase) {
      throw new Meteor.Error('invalid-phase', 'Can only advance to a later phase');
    }

    if (newPhase < 1 || newPhase > 3) {
      throw new Meteor.Error('invalid-phase', 'Phase must be between 1 and 3');
    }

    if (topic.currentPhase === 1 && newPhase > 2) {
      throw new Meteor.Error('invalid-phase', 'Must advance from Definition to Collection phase first');
    }

    Topics.update(topicId, {
      $set: {
        currentPhase: newPhase,
        phaseAdvancedAt: new Date()
      }
    });

    return { success: true };
  },

  // Create a criterion (Definition phase)
  'criteria.create'(criterionData) {
    check(criterionData, {
      name: String,
      description: Match.Optional(String),
      topicId: String,
      userId: String,
      isShared: Match.Optional(Boolean)
    });

    const topic = Topics.findOne(criterionData.topicId);
    if (!topic) {
      throw new Meteor.Error('topic-not-found', 'Topic not found');
    }

    if (!topic.participants.includes(criterionData.userId)) {
      throw new Meteor.Error('not-participant', 'User is not a participant in this topic');
    }

    // Get current criteria count for ranking
    const criteriaCount = Criteria.find({ 
      user: criterionData.userId,
      topic: criterionData.topicId
    }).count();

    const criterionId = Random.id();
    
    const criterion = {
      _id: criterionId,
      name: criterionData.name,
      description: criterionData.description || '',
      topic: criterionData.topicId,
      user: criterionData.userId,
      rank: criteriaCount + 1,
      isShared: !!criterionData.isShared,
      createdAt: new Date()
    };

    Criteria.insert(criterion);

    return { success: true, criterionId: criterionId };
  },

  // Update criterion sharing status
  'criteria.updateSharing'(criterionId, isShared, userId) {
    check(criterionId, String);
    check(isShared, Boolean);
    check(userId, String);

    const criterion = Criteria.findOne(criterionId);
    if (!criterion) {
      throw new Meteor.Error('criterion-not-found', 'Criterion not found');
    }

    if (criterion.user !== userId) {
      throw new Meteor.Error('not-authorized', 'Only the criterion creator can modify sharing');
    }

    Criteria.update(criterionId, {
      $set: { isShared: isShared }
    });

    return { success: true };
  },

  // Create a candidate (Collection phase preparation)
  'candidates.create'(candidateData) {
    check(candidateData, {
      name: String,
      description: Match.Optional(String),
      topicId: String,
      userId: String
    });

    const topic = Topics.findOne(candidateData.topicId);
    if (!topic) {
      throw new Meteor.Error('topic-not-found', 'Topic not found');
    }

    if (!topic.participants.includes(candidateData.userId)) {
      throw new Meteor.Error('not-participant', 'User is not a participant in this topic');
    }

    const candidateId = Random.id();
    
    const candidate = {
      _id: candidateId,
      name: candidateData.name,
      description: candidateData.description || '',
      topic: candidateData.topicId,
      createdAt: new Date()
    };

    Candidates.insert(candidate);

    return { success: true, candidateId: candidateId };
  },

  // Create or update an evaluation (Collection phase)
  'evaluations.submit'(evaluationData) {
    check(evaluationData, {
      userId: String,
      candidateId: String,
      criterionId: String,
      score: Number,
      notes: Match.Optional(String)
    });

    // Validate score range
    if (evaluationData.score < 1 || evaluationData.score > 10) {
      throw new Meteor.Error('invalid-score', 'Score must be between 1 and 10');
    }

    const candidate = Candidates.findOne(evaluationData.candidateId);
    if (!candidate) {
      throw new Meteor.Error('candidate-not-found', 'Candidate not found');
    }

    const criterion = Criteria.findOne(evaluationData.criterionId);
    if (!criterion) {
      throw new Meteor.Error('criterion-not-found', 'Criterion not found');
    }

    const topic = Topics.findOne(candidate.topic);
    if (!topic) {
      throw new Meteor.Error('topic-not-found', 'Topic not found');
    }

    if (!topic.participants.includes(evaluationData.userId)) {
      throw new Meteor.Error('not-participant', 'User is not a participant in this topic');
    }

    if (topic.currentPhase < 2) {
      throw new Meteor.Error('invalid-phase', 'Topic must be in Collection phase or higher to add evaluations');
    }

    // Check if evaluation already exists
    const existingEvaluation = Evaluations.findOne({
      user: evaluationData.userId,
      candidate: evaluationData.candidateId,
      criterion: evaluationData.criterionId
    });

    if (existingEvaluation) {
      // Update existing evaluation
      Evaluations.update(existingEvaluation._id, {
        $set: {
          score: evaluationData.score,
          notes: evaluationData.notes || '',
          updatedAt: new Date()
        }
      });
      return { success: true, evaluationId: existingEvaluation._id };
    } else {
      // Create new evaluation
      const evaluationId = Random.id();
      
      const evaluation = {
        _id: evaluationId,
        user: evaluationData.userId,
        candidate: evaluationData.candidateId,
        criterion: evaluationData.criterionId,
        score: evaluationData.score,
        notes: evaluationData.notes || '',
        createdAt: new Date()
      };

      Evaluations.insert(evaluation);
      return { success: true, evaluationId: evaluationId };
    }
  },

  // Get aggregated results (Decision phase only)
  'evaluations.getAggregated'(topicId, userId) {
    check(topicId, String);
    check(userId, String);

    const topic = Topics.findOne(topicId);
    if (!topic) {
      throw new Meteor.Error('topic-not-found', 'Topic not found');
    }

    if (!topic.participants.includes(userId)) {
      throw new Meteor.Error('not-participant', 'User is not a participant in this topic');
    }

    if (topic.currentPhase < 3) {
      throw new Meteor.Error('invalid-phase', 'Aggregated results are only available in the Decision phase');
    }

    // Get all candidates and shared criteria for the topic
    const candidates = Candidates.find({ topic: topicId }).fetch();
    const sharedCriteria = Criteria.find({ topic: topicId, isShared: true }).fetch();

    const results = [];

    candidates.forEach(candidate => {
      const candidateResult = {
        candidate: candidate,
        criteriaScores: [],
        averageScore: 0,
        scoreVariance: 0
      };

      let totalScore = 0;
      let scoreCount = 0;
      let allScores = [];

      sharedCriteria.forEach(criterion => {
        const evaluations = Evaluations.find({
          candidate: candidate._id,
          criterion: criterion._id
        }).fetch();

        const scores = evaluations.map(e => e.score);
        const averageScore = scores.length > 0 
          ? scores.reduce((a, b) => a + b, 0) / scores.length 
          : 0;

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
      });

      candidateResult.averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;

      const overallAverage = allScores.length > 0
        ? allScores.reduce((a, b) => a + b, 0) / allScores.length
        : 0;

      candidateResult.scoreVariance = allScores.length > 0
        ? allScores.reduce((a, b) => a + Math.pow(b - overallAverage, 2), 0) / allScores.length
        : 0;

      results.push(candidateResult);
    });

    return { success: true, results: results };
  }
});