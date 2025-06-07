import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { DecisionRooms, Ideas, Votes, Participants } from './collections.js';

Meteor.methods({
  // Create a new decision room
  'rooms.create'(roomData) {
    check(roomData, {
      title: String,
      description: Match.Optional(String),
      votingSystem: String,
      votesPerParticipant: Number,
      phases: Object,
      authentication: String
    });

    const roomId = Random.id();
    const userId = this.userId || Random.id(); // Anonymous user gets random ID
    
    const room = {
      _id: roomId,
      title: roomData.title,
      description: roomData.description || '',
      createdBy: userId,
      votingSystem: roomData.votingSystem,
      votesPerParticipant: roomData.votesPerParticipant,
      phases: roomData.phases,
      authentication: roomData.authentication,
      status: 'active',
      participants: [userId],
      inviteUrls: [],
      createdAt: new Date()
    };

    DecisionRooms.insert(room);
    
    return {
      roomId: roomId,
      roomUrl: `/room/${roomId}`,
      success: true
    };
  },

  // Join a room
  'rooms.join'(roomId, participantData = {}) {
    check(roomId, String);
    check(participantData, Object);

    const room = DecisionRooms.findOne(roomId);
    if (!room) {
      throw new Meteor.Error('room-not-found', 'Room not found');
    }

    if (room.status === 'destroyed') {
      throw new Meteor.Error('room-destroyed', 'Room has been destroyed');
    }

    const participantId = this.userId || Random.id();
    
    // Add participant if not already in room
    if (!room.participants.includes(participantId)) {
      DecisionRooms.update(roomId, {
        $addToSet: { participants: participantId }
      });
    }

    // Add participant record
    Participants.upsert(
      { roomId: roomId, participantId: participantId },
      {
        $set: {
          roomId: roomId,
          participantId: participantId,
          name: participantData.name || 'Anonymous',
          joinedAt: new Date(),
          isAnonymous: !this.userId
        }
      }
    );

    return { success: true, participantId: participantId };
  },

  // Submit an idea
  'ideas.submit'(roomId, ideaText) {
    check(roomId, String);
    check(ideaText, String);

    const room = DecisionRooms.findOne(roomId);
    if (!room) {
      throw new Meteor.Error('room-not-found', 'Room not found');
    }

    if (room.status !== 'active') {
      throw new Meteor.Error('room-inactive', 'Room is not active');
    }

    const participantId = this.userId || this.connection.id;
    
    if (!room.participants.includes(participantId)) {
      throw new Meteor.Error('not-participant', 'Not a participant in this room');
    }

    const ideaId = Ideas.insert({
      roomId: roomId,
      text: ideaText,
      submittedBy: participantId,
      submittedAt: new Date(),
      voteCount: 0
    });

    return { success: true, ideaId: ideaId };
  },

  // Vote on an idea
  'ideas.vote'(roomId, ideaId, voteData = {}) {
    check(roomId, String);
    check(ideaId, String);
    check(voteData, Object);

    const room = DecisionRooms.findOne(roomId);
    if (!room) {
      throw new Meteor.Error('room-not-found', 'Room not found');
    }

    const idea = Ideas.findOne(ideaId);
    if (!idea || idea.roomId !== roomId) {
      throw new Meteor.Error('idea-not-found', 'Idea not found in this room');
    }

    const participantId = this.userId || this.connection.id;
    
    if (!room.participants.includes(participantId)) {
      throw new Meteor.Error('not-participant', 'Not a participant in this room');
    }

    // Check if user has already voted on this idea (for some voting systems)
    const existingVote = Votes.findOne({ roomId, ideaId, participantId });
    
    if (room.votingSystem === 'first-past-the-post' && existingVote) {
      throw new Meteor.Error('already-voted', 'Already voted on this idea');
    }

    // Check vote limits for dot voting
    if (room.votingSystem === 'dot-voting') {
      const userVotes = Votes.find({ roomId, participantId }).count();
      if (userVotes >= room.votesPerParticipant) {
        throw new Meteor.Error('vote-limit-exceeded', 'Vote limit exceeded');
      }
    }

    const voteId = Votes.insert({
      roomId: roomId,
      ideaId: ideaId,
      participantId: participantId,
      votedAt: new Date(),
      ...voteData
    });

    // Update idea vote count
    const voteCount = Votes.find({ ideaId: ideaId }).count();
    Ideas.update(ideaId, { $set: { voteCount: voteCount } });

    return { success: true, voteId: voteId };
  },

  // End voting and lock results
  'rooms.endVoting'(roomId) {
    check(roomId, String);

    const room = DecisionRooms.findOne(roomId);
    if (!room) {
      throw new Meteor.Error('room-not-found', 'Room not found');
    }

    const userId = this.userId || this.connection.id;
    if (room.createdBy !== userId) {
      throw new Meteor.Error('not-authorized', 'Only room creator can end voting');
    }

    DecisionRooms.update(roomId, {
      $set: {
        status: 'voting-ended',
        endedAt: new Date()
      }
    });

    return { success: true };
  },

  // Destroy a room
  'rooms.destroy'(roomId) {
    check(roomId, String);

    const room = DecisionRooms.findOne(roomId);
    if (!room) {
      throw new Meteor.Error('room-not-found', 'Room not found');
    }

    const userId = this.userId || this.connection.id;
    if (room.createdBy !== userId) {
      throw new Meteor.Error('not-authorized', 'Only room creator can destroy room');
    }

    // Mark room as destroyed instead of deleting to preserve data
    DecisionRooms.update(roomId, {
      $set: {
        status: 'destroyed',
        destroyedAt: new Date()
      }
    });

    return { success: true };
  },

  // Generate invite URL
  'rooms.generateInvite'(roomId, inviteType = 'room') {
    check(roomId, String);
    check(inviteType, String);

    const room = DecisionRooms.findOne(roomId);
    if (!room) {
      throw new Meteor.Error('room-not-found', 'Room not found');
    }

    const inviteId = Random.id();
    const inviteUrl = inviteType === 'individual' 
      ? `/invite/${inviteId}` 
      : `/room/${roomId}`;

    const invite = {
      id: inviteId,
      type: inviteType,
      url: inviteUrl,
      createdAt: new Date(),
      usedBy: []
    };

    DecisionRooms.update(roomId, {
      $push: { inviteUrls: invite }
    });

    return { success: true, inviteUrl: inviteUrl, inviteId: inviteId };
  }
});