import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { DecisionRooms, Ideas, Votes, Participants } from '../imports/api/collections.js';
import '../imports/api/methods.js';

import './main.html';

// Global template helpers
Template.registerHelper('formatDate', function(date) {
  return date ? date.toLocaleDateString() : '';
});

// Application Layout
Template.applicationLayout.onCreated(function() {
  this.subscribe('decisionRooms');
});

Template.applicationLayout.helpers({
  mainTemplate() {
    return Session.get('mainTemplate') || 'home';
  }
});

Template.applicationLayout.events({
  'click #logout-btn'(event, instance) {
    Meteor.logout();
  }
});

// Home Template
Template.home.onCreated(function() {
  this.subscribe('decisionRooms');
});

Template.home.helpers({
  recentRooms() {
    return DecisionRooms.find({}, { 
      sort: { createdAt: -1 }, 
      limit: 5 
    });
  }
});

Template.home.events({
  'submit #create-room-form'(event, instance) {
    event.preventDefault();
    
    const title = event.target['room-title'].value;
    const description = event.target['room-description'].value;
    const votingSystem = event.target['voting-system'].value;
    const votesPerParticipant = parseInt(event.target['votes-per-participant'].value);
    const phaseType = event.target.phases.value;
    const authentication = event.target.authentication.value;

    const phases = {
      ideaSubmission: phaseType === 'separate',
      voting: true,
      combined: phaseType === 'combined'
    };

    Meteor.call('rooms.create', {
      title,
      description,
      votingSystem,
      votesPerParticipant,
      phases,
      authentication
    }, (error, result) => {
      if (error) {
        alert('Error creating room: ' + error.message);
      } else {
        FlowRouter.go('/room/' + result.roomId);
      }
    });
  }
});

// Room Template
Template.room.onCreated(function() {
  const roomId = FlowRouter.getParam('roomId');
  this.roomId = new ReactiveVar(roomId);
  
  this.autorun(() => {
    const id = this.roomId.get();
    if (id) {
      this.subscribe('ideas', id);
      this.subscribe('votes', id);
      this.subscribe('participants', id);
    }
  });
});

Template.room.helpers({
  room() {
    const roomId = FlowRouter.getParam('roomId');
    return DecisionRooms.findOne(roomId);
  },
  
  ideas() {
    const roomId = FlowRouter.getParam('roomId');
    return Ideas.find({ roomId }, { sort: { submittedAt: -1 } });
  },
  
  rankedIdeas() {
    const roomId = FlowRouter.getParam('roomId');
    return Ideas.find({ roomId }, { sort: { voteCount: -1, submittedAt: 1 } });
  },
  
  participants() {
    const roomId = FlowRouter.getParam('roomId');
    return Participants.find({ roomId });
  },
  
  isRoomCreator() {
    const room = DecisionRooms.findOne(FlowRouter.getParam('roomId'));
    return room && room.createdBy === (Meteor.userId() || Meteor.connection._lastSessionId);
  },
  
  roomUrl() {
    return window.location.origin + '/room/' + FlowRouter.getParam('roomId');
  },
  
  inviteUrls() {
    const room = DecisionRooms.findOne(FlowRouter.getParam('roomId'));
    return room ? room.inviteUrls : [];
  }
});

Template.room.events({
  'submit #submit-idea-form'(event, instance) {
    event.preventDefault();
    
    const roomId = FlowRouter.getParam('roomId');
    const ideaText = event.target['idea-text'].value.trim();
    
    if (!ideaText) return;
    
    Meteor.call('ideas.submit', roomId, ideaText, (error, result) => {
      if (error) {
        alert('Error submitting idea: ' + error.message);
      } else {
        event.target.reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('submitIdeaModal'));
        modal.hide();
      }
    });
  },
  
  'click .vote-btn'(event, instance) {
    const roomId = FlowRouter.getParam('roomId');
    const ideaId = event.currentTarget.getAttribute('data-idea-id');
    
    Meteor.call('ideas.vote', roomId, ideaId, {}, (error, result) => {
      if (error) {
        alert('Error voting: ' + error.message);
      }
    });
  },
  
  'click #end-voting-btn'(event, instance) {
    const roomId = FlowRouter.getParam('roomId');
    
    if (confirm('Are you sure you want to end voting? This cannot be undone.')) {
      Meteor.call('rooms.endVoting', roomId, (error, result) => {
        if (error) {
          alert('Error ending voting: ' + error.message);
        }
      });
    }
  },
  
  'click #destroy-room-btn'(event, instance) {
    const roomId = FlowRouter.getParam('roomId');
    
    if (confirm('Are you sure you want to destroy this room? This cannot be undone.')) {
      Meteor.call('rooms.destroy', roomId, (error, result) => {
        if (error) {
          alert('Error destroying room: ' + error.message);
        } else {
          FlowRouter.go('/');
        }
      });
    }
  },
  
  'click #copy-url-btn'(event, instance) {
    const urlInput = document.getElementById('room-url');
    urlInput.select();
    document.execCommand('copy');
  },
  
  'click .copy-invite-btn'(event, instance) {
    const input = event.currentTarget.previousElementSibling;
    input.select();
    document.execCommand('copy');
  },
  
  'click #generate-invite-btn'(event, instance) {
    const roomId = FlowRouter.getParam('roomId');
    
    Meteor.call('rooms.generateInvite', roomId, 'individual', (error, result) => {
      if (error) {
        alert('Error generating invite: ' + error.message);
      }
    });
  }
});

// Simple Router Setup
FlowRouter.route('/', {
  action() {
    Session.set('mainTemplate', 'home');
  }
});

FlowRouter.route('/room/:roomId', {
  action(params) {
    // Join room automatically
    Meteor.call('rooms.join', params.roomId, {
      name: Meteor.user() ? Meteor.user().username : 'Anonymous'
    });
    
    Session.set('mainTemplate', 'room');
  }
});

// Startup
Meteor.startup(() => {
  // Initialize router
  FlowRouter.initialize();
});