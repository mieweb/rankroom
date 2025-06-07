import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

// Decision Rooms Collection
export const DecisionRooms = new Mongo.Collection('decisionRooms');

// Room Schema
const RoomSchema = {
  _id: String,
  title: String,
  description: String,
  createdBy: String,
  votingSystem: String, // 'dot-voting', 'first-past-the-post', 'alternative-voting'
  votesPerParticipant: Number,
  phases: {
    ideaSubmission: Boolean,
    voting: Boolean,
    combined: Boolean
  },
  authentication: String, // 'anonymous', 'required', 'sso'
  status: String, // 'active', 'voting-ended', 'destroyed'
  participants: [String],
  inviteUrls: [Object],
  createdAt: Date,
  endedAt: Date
};

// Ideas Collection
export const Ideas = new Mongo.Collection('ideas');

// Votes Collection  
export const Votes = new Mongo.Collection('votes');

// Participants Collection
export const Participants = new Mongo.Collection('participants');

if (Meteor.isServer) {
  // Publish collections
  Meteor.publish('decisionRooms', function() {
    return DecisionRooms.find();
  });
  
  Meteor.publish('ideas', function(roomId) {
    check(roomId, String);
    return Ideas.find({ roomId: roomId });
  });
  
  Meteor.publish('votes', function(roomId) {
    check(roomId, String);
    return Votes.find({ roomId: roomId });
  });
  
  Meteor.publish('participants', function(roomId) {
    check(roomId, String);
    return Participants.find({ roomId: roomId });
  });
}