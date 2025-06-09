import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Topics, Criteria, Candidates, Evaluations, Users } from '../imports/api/collections.js';
import '../imports/api/methods.js';

import './main.html';

// Global template helpers
Template.registerHelper('formatDate', function(date) {
  return date ? date.toLocaleDateString() : '';
});

Template.registerHelper('formatScore', function(score) {
  return score ? score.toFixed(1) : '0.0';
});

Template.registerHelper('eq', function(a, b) {
  return a === b;
});

// Application Layout
Template.applicationLayout.onCreated(function() {
  this.subscribe('topics');
  this.subscribe('users');
});

Template.applicationLayout.helpers({
  mainTemplate() {
    return Session.get('mainTemplate') || 'home';
  },
  
  currentUser() {
    return Users.findOne(Session.get('currentUserId'));
  }
});

Template.applicationLayout.events({
  'click #logout-btn'(event, instance) {
    Session.set('currentUserId', null);
  },
  
  'submit #login-form'(event, instance) {
    event.preventDefault();
    
    const name = event.target['user-name'].value.trim();
    const email = event.target['user-email'].value.trim();
    
    if (!name || !email) return;
    
    Meteor.call('users.create', { name, email }, (error, result) => {
      if (error) {
        alert('Error logging in: ' + error.message);
      } else {
        Session.set('currentUserId', result.userId);
        const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        modal.hide();
        event.target.reset();
      }
    });
  }
});

// Home Template
Template.home.onCreated(function() {
  this.subscribe('topics');
  this.subscribe('users');
});

Template.home.helpers({
  currentUser() {
    return Users.findOne(Session.get('currentUserId'));
  },
  
  recentTopics() {
    const userId = Session.get('currentUserId');
    if (!userId) return [];
    
    return Topics.find({ 
      participants: userId 
    }, { 
      sort: { createdAt: -1 }, 
      limit: 5 
    });
  }
});

Template.home.events({
  'submit #create-topic-form'(event, instance) {
    event.preventDefault();
    
    const userId = Session.get('currentUserId');
    if (!userId) {
      alert('Please log in to create a topic');
      return;
    }
    
    const name = event.target['topic-name'].value.trim();
    const description = event.target['topic-description'].value.trim();
    
    if (!name) return;

    Meteor.call('topics.create', {
      name,
      description,
      userId
    }, (error, result) => {
      if (error) {
        alert('Error creating topic: ' + error.message);
      } else {
        FlowRouter.go('/topic/' + result.topicId);
      }
    });
  }
});

// Topic Template
Template.topic.onCreated(function() {
  const topicId = FlowRouter.getParam('topicId');
  this.topicId = new ReactiveVar(topicId);
  this.selectedCandidate = new ReactiveVar(null);
  
  this.autorun(() => {
    const id = this.topicId.get();
    const userId = Session.get('currentUserId');
    if (id) {
      this.subscribe('topic', id);
      this.subscribe('criteria', id);
      this.subscribe('candidates', id);
      this.subscribe('evaluations', id, userId);
    }
  });
});

Template.topic.helpers({
  topic() {
    const topicId = FlowRouter.getParam('topicId');
    return Topics.findOne(topicId);
  },
  
  participants() {
    const topic = Topics.findOne(FlowRouter.getParam('topicId'));
    if (!topic) return [];
    
    return Users.find({ _id: { $in: topic.participants } });
  },
  
  isTopicLeader() {
    const topic = Topics.findOne(FlowRouter.getParam('topicId'));
    const userId = Session.get('currentUserId');
    return topic && topic.createdBy === userId;
  },
  
  canAdvancePhase() {
    const topic = Topics.findOne(FlowRouter.getParam('topicId'));
    return topic && topic.currentPhase < 3;
  },
  
  nextPhaseName() {
    const topic = Topics.findOne(FlowRouter.getParam('topicId'));
    if (!topic) return '';
    
    const phaseNames = { 1: 'Definition', 2: 'Collection', 3: 'Decision' };
    return phaseNames[topic.currentPhase + 1] || '';
  },
  
  phaseNames() {
    return { 1: 'Definition', 2: 'Collection', 3: 'Decision' };
  },
  
  phaseProgress() {
    const topic = Topics.findOne(FlowRouter.getParam('topicId'));
    if (!topic) return 0;
    return (topic.currentPhase / 3) * 100;
  },
  
  phaseProgressClass() {
    const topic = Topics.findOne(FlowRouter.getParam('topicId'));
    if (!topic) return 'bg-secondary';
    
    switch (topic.currentPhase) {
      case 1: return 'bg-primary';
      case 2: return 'bg-warning';
      case 3: return 'bg-success';
      default: return 'bg-secondary';
    }
  },
  
  topicUrl() {
    return window.location.origin + '/topic/' + FlowRouter.getParam('topicId');
  }
});

Template.topic.events({
  'click #advance-phase-btn'(event, instance) {
    const topicId = FlowRouter.getParam('topicId');
    const topic = Topics.findOne(topicId);
    const userId = Session.get('currentUserId');
    
    if (!topic || !userId) return;
    
    const newPhase = topic.currentPhase + 1;
    const phaseNames = { 2: 'Collection', 3: 'Decision' };
    
    if (confirm(`Are you sure you want to advance to the ${phaseNames[newPhase]} phase?`)) {
      Meteor.call('topics.advancePhase', topicId, newPhase, userId, (error, result) => {
        if (error) {
          alert('Error advancing phase: ' + error.message);
        }
      });
    }
  },
  
  'click #copy-url-btn'(event, instance) {
    const urlInput = document.getElementById('topic-url');
    urlInput.select();
    document.execCommand('copy');
  }
});

// Definition Phase Template
Template.definitionPhase.helpers({
  personalCriteria() {
    const topicId = FlowRouter.getParam('topicId');
    const userId = Session.get('currentUserId');
    
    return Criteria.find({ 
      topic: topicId,
      user: userId
    }, { sort: { rank: 1 } });
  },
  
  sharedCriteria() {
    const topicId = FlowRouter.getParam('topicId');
    
    return Criteria.find({ 
      topic: topicId,
      isShared: true
    }, { sort: { createdAt: 1 } });
  }
});

Template.definitionPhase.events({
  'submit #add-criterion-form'(event, instance) {
    event.preventDefault();
    
    const topicId = FlowRouter.getParam('topicId');
    const userId = Session.get('currentUserId');
    
    const name = event.target['criterion-name'].value.trim();
    const description = event.target['criterion-description'].value.trim();
    const isShared = event.target['criterion-shared'].checked;
    
    if (!name) return;

    Meteor.call('criteria.create', {
      name,
      description,
      topicId,
      userId,
      isShared
    }, (error, result) => {
      if (error) {
        alert('Error creating criterion: ' + error.message);
      } else {
        event.target.reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCriterionModal'));
        modal.hide();
      }
    });
  },
  
  'click .share-criterion-btn'(event, instance) {
    const criterionId = event.currentTarget.getAttribute('data-criterion-id');
    const userId = Session.get('currentUserId');
    
    Meteor.call('criteria.updateSharing', criterionId, true, userId, (error, result) => {
      if (error) {
        alert('Error sharing criterion: ' + error.message);
      }
    });
  }
});

// Collection Phase Template
Template.collectionPhase.onCreated(function() {
  this.selectedCandidate = new ReactiveVar(null);
});

Template.collectionPhase.helpers({
  candidates() {
    const topicId = FlowRouter.getParam('topicId');
    return Candidates.find({ topic: topicId }, { sort: { createdAt: 1 } });
  },
  
  sharedCriteria() {
    const topicId = FlowRouter.getParam('topicId');
    return Criteria.find({ 
      topic: topicId,
      isShared: true
    }, { sort: { createdAt: 1 } });
  },
  
  selectedCandidate() {
    return Template.instance().selectedCandidate.get();
  },
  
  getEvaluationScore(criterionId, candidateId) {
    const userId = Session.get('currentUserId');
    const evaluation = Evaluations.findOne({ 
      user: userId,
      candidate: candidateId,
      criterion: criterionId
    });
    return evaluation ? evaluation.score : 5;
  },
  
  getEvaluationNotes(criterionId, candidateId) {
    const userId = Session.get('currentUserId');
    const evaluation = Evaluations.findOne({ 
      user: userId,
      candidate: candidateId,
      criterion: criterionId
    });
    return evaluation ? evaluation.notes : '';
  }
});

Template.collectionPhase.events({
  'click .candidate-item'(event, instance) {
    const candidateId = event.currentTarget.getAttribute('data-candidate-id');
    const candidate = Candidates.findOne(candidateId);
    instance.selectedCandidate.set(candidate);
  },
  
  'submit #add-candidate-form'(event, instance) {
    event.preventDefault();
    
    const topicId = FlowRouter.getParam('topicId');
    const userId = Session.get('currentUserId');
    
    const name = event.target['candidate-name'].value.trim();
    const description = event.target['candidate-description'].value.trim();
    
    if (!name) return;

    Meteor.call('candidates.create', {
      name,
      description,
      topicId,
      userId
    }, (error, result) => {
      if (error) {
        alert('Error creating candidate: ' + error.message);
      } else {
        event.target.reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCandidateModal'));
        modal.hide();
      }
    });
  },
  
  'input .form-range'(event, instance) {
    const scoreDisplay = event.currentTarget.closest('.mb-4').querySelector('.score-display');
    scoreDisplay.textContent = event.currentTarget.value;
  },
  
  'submit #evaluation-form'(event, instance) {
    event.preventDefault();
    
    const userId = Session.get('currentUserId');
    const candidate = instance.selectedCandidate.get();
    
    if (!candidate) return;
    
    const ranges = event.target.querySelectorAll('.form-range');
    const textareas = event.target.querySelectorAll('textarea');
    
    ranges.forEach((range, index) => {
      const criterionId = range.getAttribute('data-criterion-id');
      const score = parseInt(range.value);
      const notes = textareas[index].value.trim();
      
      Meteor.call('evaluations.submit', {
        userId,
        candidateId: candidate._id,
        criterionId,
        score,
        notes
      }, (error, result) => {
        if (error) {
          console.error('Error submitting evaluation:', error.message);
        }
      });
    });
    
    alert('Evaluations saved successfully!');
  }
});

// Decision Phase Template
Template.decisionPhase.onCreated(function() {
  this.aggregatedResults = new ReactiveVar([]);
  
  this.autorun(() => {
    const topicId = FlowRouter.getParam('topicId');
    const userId = Session.get('currentUserId');
    
    if (topicId && userId) {
      Meteor.call('evaluations.getAggregated', topicId, userId, (error, result) => {
        if (error) {
          console.error('Error getting aggregated results:', error.message);
        } else {
          // Sort by average score descending
          const sortedResults = result.results.sort((a, b) => b.averageScore - a.averageScore);
          this.aggregatedResults.set(sortedResults);
        }
      });
    }
  });
});

Template.decisionPhase.helpers({
  aggregatedResults() {
    return Template.instance().aggregatedResults.get();
  }
});

// Simple Router Setup
FlowRouter.route('/', {
  action() {
    Session.set('mainTemplate', 'home');
  }
});

FlowRouter.route('/topic/:topicId', {
  action(params) {
    const userId = Session.get('currentUserId');
    
    if (userId) {
      // Join topic automatically
      Meteor.call('topics.join', params.topicId, userId, (error, result) => {
        if (error) {
          console.error('Error joining topic:', error.message);
        }
      });
    }
    
    Session.set('mainTemplate', 'topic');
  }
});

// Startup
Meteor.startup(() => {
  // Initialize router
  FlowRouter.initialize();
});