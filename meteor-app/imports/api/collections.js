import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';

// Topics Collection (3-phase decision-making)
export const Topics = new Mongo.Collection('topics');

// Topic Schema
const TopicSchema = {
  _id: String,
  name: String,
  description: String,
  currentPhase: Number, // 1: Definition, 2: Collection, 3: Decision
  createdBy: String,
  createdAt: Date,
  participants: [String],
  phaseAdvancedAt: Date,
  settings: {
    allowCriteriaCollaboration: Boolean,
    hideEvaluationsDuringCollection: Boolean
  }
};

// Criteria Collection
export const Criteria = new Mongo.Collection('criteria');

// Criteria Schema
const CriteriaSchema = {
  _id: String,
  name: String,
  description: String,
  topic: String,
  user: String,
  rank: Number,
  isShared: Boolean,
  createdAt: Date
};

// Candidates Collection
export const Candidates = new Mongo.Collection('candidates');

// Candidate Schema
const CandidateSchema = {
  _id: String,
  name: String,
  description: String,
  topic: String,
  createdAt: Date
};

// Evaluations Collection
export const Evaluations = new Mongo.Collection('evaluations');

// Evaluation Schema
const EvaluationSchema = {
  _id: String,
  user: String,
  candidate: String,
  criterion: String,
  score: Number, // 1-10
  notes: String,
  createdAt: Date
};

// Users Collection
export const Users = new Mongo.Collection('users');

// User Schema
const UserSchema = {
  _id: String,
  name: String,
  email: String,
  topics: [String],
  createdAt: Date
};

if (Meteor.isServer) {
  // Publish collections
  Meteor.publish('topics', function() {
    return Topics.find();
  });
  
  Meteor.publish('topic', function(topicId) {
    check(topicId, String);
    return Topics.find({ _id: topicId });
  });
  
  Meteor.publish('criteria', function(topicId) {
    check(topicId, String);
    return Criteria.find({ topic: topicId });
  });
  
  Meteor.publish('candidates', function(topicId) {
    check(topicId, String);
    return Candidates.find({ topic: topicId });
  });
  
  Meteor.publish('evaluations', function(topicId, userId) {
    check(topicId, String);
    check(userId, Match.Maybe(String));
    
    // If userId provided, return user's evaluations + aggregated in Decision phase
    if (userId) {
      const topic = Topics.findOne({ _id: topicId });
      if (topic && topic.currentPhase === 3) {
        // Decision phase - show all evaluations
        return Evaluations.find({ 
          candidate: { $in: Candidates.find({ topic: topicId }).map(c => c._id) }
        });
      } else {
        // Definition/Collection phase - only user's own evaluations
        return Evaluations.find({ 
          user: userId,
          candidate: { $in: Candidates.find({ topic: topicId }).map(c => c._id) }
        });
      }
    } else {
      // No user specified - return empty
      return this.ready();
    }
  });
  
  Meteor.publish('users', function() {
    return Users.find();
  });
}