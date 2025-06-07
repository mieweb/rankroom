const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory storage for demo purposes
// In production, this would use the same MongoDB collections as the Meteor app
let rooms = new Map();
let ideas = new Map();
let votes = new Map();
let participants = new Map();

// Create a new decision room
router.post('/', (req, res) => {
  try {
    const { title, description, votingSystem, votesPerParticipant, phases, authentication } = req.body;
    
    if (!title || !votingSystem || !votesPerParticipant) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    const roomId = uuidv4();
    const userId = uuidv4(); // Anonymous user
    
    const room = {
      _id: roomId,
      title,
      description: description || '',
      createdBy: userId,
      votingSystem,
      votesPerParticipant,
      phases: phases || { ideaSubmission: true, voting: true, combined: true },
      authentication: authentication || 'anonymous',
      status: 'active',
      participants: [userId],
      inviteUrls: [],
      createdAt: new Date(),
      ideas: []
    };

    rooms.set(roomId, room);
    
    res.json({
      success: true,
      roomId: roomId,
      roomUrl: `/room/${roomId}`
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get room details
router.get('/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const room = rooms.get(roomId);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    // Get ideas for this room
    const roomIdeas = Array.from(ideas.values()).filter(idea => idea.roomId === roomId);
    
    // Calculate vote counts
    roomIdeas.forEach(idea => {
      const ideaVotes = Array.from(votes.values()).filter(vote => vote.ideaId === idea._id);
      idea.voteCount = ideaVotes.length;
    });

    // Sort ideas by vote count
    roomIdeas.sort((a, b) => b.voteCount - a.voteCount);
    
    const roomData = {
      ...room,
      ideas: roomIdeas,
      participants: Array.from(participants.values()).filter(p => p.roomId === roomId)
    };

    res.json(roomData);
  } catch (error) {
    console.error('Error getting room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Join a room
router.post('/:roomId/join', (req, res) => {
  try {
    const { roomId } = req.params;
    const { name } = req.body;
    
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    if (room.status === 'destroyed') {
      return res.status(410).json({ 
        success: false, 
        message: 'Room has been destroyed' 
      });
    }

    const participantId = uuidv4();
    
    // Add participant
    const participant = {
      _id: participantId,
      roomId: roomId,
      participantId: participantId,
      name: name || 'Anonymous',
      joinedAt: new Date(),
      isAnonymous: true
    };

    participants.set(participantId, participant);
    
    // Add to room participants if not already there
    if (!room.participants.includes(participantId)) {
      room.participants.push(participantId);
    }

    res.json({ 
      success: true, 
      participantId: participantId 
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Submit an idea
router.post('/:roomId/ideas', (req, res) => {
  try {
    const { roomId } = req.params;
    const { text } = req.body;
    
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    if (room.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Room is not active' 
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Idea text is required' 
      });
    }

    const ideaId = uuidv4();
    const participantId = uuidv4(); // Anonymous submission
    
    const idea = {
      _id: ideaId,
      roomId: roomId,
      text: text.trim(),
      submittedBy: participantId,
      submittedAt: new Date(),
      voteCount: 0
    };

    ideas.set(ideaId, idea);
    
    // Emit socket event for real-time updates
    if (req.app.get('io')) {
      req.app.get('io').to(roomId).emit('ideaAdded', { roomId, idea });
    }

    res.json({ 
      success: true, 
      ideaId: ideaId 
    });
  } catch (error) {
    console.error('Error submitting idea:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get ideas for a room
router.get('/:roomId/ideas', (req, res) => {
  try {
    const { roomId } = req.params;
    
    const roomIdeas = Array.from(ideas.values()).filter(idea => idea.roomId === roomId);
    
    // Calculate vote counts
    roomIdeas.forEach(idea => {
      const ideaVotes = Array.from(votes.values()).filter(vote => vote.ideaId === idea._id);
      idea.voteCount = ideaVotes.length;
    });

    // Sort by vote count descending
    roomIdeas.sort((a, b) => b.voteCount - a.voteCount);

    res.json(roomIdeas);
  } catch (error) {
    console.error('Error getting ideas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Vote on an idea
router.post('/:roomId/vote', (req, res) => {
  try {
    const { roomId } = req.params;
    const { ideaId } = req.body;
    
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    const idea = ideas.get(ideaId);
    if (!idea || idea.roomId !== roomId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Idea not found in this room' 
      });
    }

    if (room.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Voting has ended' 
      });
    }

    const participantId = uuidv4(); // Anonymous vote
    const voteId = uuidv4();
    
    // Check vote limits for dot voting
    if (room.votingSystem === 'dot-voting') {
      const userVotes = Array.from(votes.values()).filter(vote => 
        vote.roomId === roomId && vote.participantId === participantId
      );
      if (userVotes.length >= room.votesPerParticipant) {
        return res.status(400).json({ 
          success: false, 
          message: 'Vote limit exceeded' 
        });
      }
    }

    const vote = {
      _id: voteId,
      roomId: roomId,
      ideaId: ideaId,
      participantId: participantId,
      votedAt: new Date()
    };

    votes.set(voteId, vote);
    
    // Emit socket event for real-time updates
    if (req.app.get('io')) {
      req.app.get('io').to(roomId).emit('voteAdded', { roomId, ideaId, vote });
    }

    res.json({ 
      success: true, 
      voteId: voteId 
    });
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// End voting
router.post('/:roomId/end-voting', (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    room.status = 'voting-ended';
    room.endedAt = new Date();

    res.json({ success: true });
  } catch (error) {
    console.error('Error ending voting:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Destroy room
router.delete('/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    room.status = 'destroyed';
    room.destroyedAt = new Date();

    res.json({ success: true });
  } catch (error) {
    console.error('Error destroying room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get room results/summary for MCP server
router.get('/:roomId/results', (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    const roomIdeas = Array.from(ideas.values()).filter(idea => idea.roomId === roomId);
    
    // Calculate vote counts and ranking
    roomIdeas.forEach(idea => {
      const ideaVotes = Array.from(votes.values()).filter(vote => vote.ideaId === idea._id);
      idea.voteCount = ideaVotes.length;
    });

    roomIdeas.sort((a, b) => b.voteCount - a.voteCount);

    const totalVotes = Array.from(votes.values()).filter(vote => vote.roomId === roomId).length;
    const participantCount = Array.from(participants.values()).filter(p => p.roomId === roomId).length;

    const results = {
      room: {
        id: room._id,
        title: room.title,
        description: room.description,
        status: room.status,
        votingSystem: room.votingSystem,
        createdAt: room.createdAt,
        endedAt: room.endedAt
      },
      statistics: {
        totalIdeas: roomIdeas.length,
        totalVotes: totalVotes,
        totalParticipants: participantCount,
        averageVotesPerIdea: roomIdeas.length > 0 ? totalVotes / roomIdeas.length : 0
      },
      rankedIdeas: roomIdeas.map((idea, index) => ({
        rank: index + 1,
        id: idea._id,
        text: idea.text,
        voteCount: idea.voteCount,
        submittedAt: idea.submittedAt
      })),
      summary: `Decision room "${room.title}" had ${roomIdeas.length} ideas from ${participantCount} participants. Top idea: "${roomIdeas[0]?.text || 'None'}" with ${roomIdeas[0]?.voteCount || 0} votes.`
    };

    res.json(results);
  } catch (error) {
    console.error('Error getting results:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;