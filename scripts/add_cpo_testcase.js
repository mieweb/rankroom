/**
 * This script adds a "Hire a CPO" test case to the Collaborative Decision Maker application
 * It creates a new topic with criteria and candidates for hiring a Chief Product Officer
 */

const mongoose = require('mongoose');
const config = require('../config/config');
const Topic = require('../models/Topic');
const User = require('../models/User');
const Criterion = require('../models/Criterion');
const Candidate = require('../models/Candidate');
const Evaluation = require('../models/Evaluation');

// Connect to MongoDB
mongoose.connect(config.database.uri, config.database.options);

const CPO_CRITERIA = [
  { name: 'Product Vision', description: 'Ability to define and articulate a compelling product vision' },
  { name: 'Strategic Thinking', description: 'Capacity to develop and execute product strategies aligned with business goals' },
  { name: 'Technical Understanding', description: 'Understanding of technical aspects and limitations of product development' },
  { name: 'Market Knowledge', description: 'Knowledge of the market, competitors, and customer needs' },
  { name: 'Leadership Skills', description: 'Ability to lead and inspire product teams' },
  { name: 'Communication', description: 'Effectiveness in communicating with stakeholders at all levels' },
  { name: 'Track Record', description: 'Proven success in previous product leadership roles' },
  { name: 'Analytical Skills', description: 'Ability to use data to make informed product decisions' },
  { name: 'UX Focus', description: 'Commitment to user experience and customer-centricity' },
  { name: 'Cross-functional Collaboration', description: 'Skill in working with engineering, marketing, sales, and other departments' }
];

const CPO_CANDIDATES = [
  { 
    name: 'Sarah Chen', 
    description: 'Former VP of Product at TechCorp with 12 years of experience in SaaS products. MBA from Stanford and Computer Science background.'
  },
  { 
    name: 'Michael Rodriguez', 
    description: 'Current Director of Product Management at InnovateSoft. Led development of 3 successful market-leading products with strong revenue growth.'
  },
  { 
    name: 'Priya Patel', 
    description: 'Product leader with experience at both startups and large enterprises. Known for user-centric design approach and analytical decision making.'
  },
  { 
    name: 'David Johnson', 
    description: 'Former CPO at SmartTech with background in AI and machine learning. Strong technical expertise combined with business acumen.'
  },
  { 
    name: 'Alexandra Kim', 
    description: 'Rising star from within the company. Current Senior Product Manager who has shown exceptional leadership and strategic thinking.'
  }
];

// Demo evaluation scores for each candidate against each criteria (1-10 scale)
// This creates realistic but varied evaluations
const DEMO_SCORES = {
  'Sarah Chen': {
    'Product Vision': 9,
    'Strategic Thinking': 8,
    'Technical Understanding': 7,
    'Market Knowledge': 9,
    'Leadership Skills': 8,
    'Communication': 7,
    'Track Record': 9,
    'Analytical Skills': 8,
    'UX Focus': 7,
    'Cross-functional Collaboration': 8
  },
  'Michael Rodriguez': {
    'Product Vision': 8,
    'Strategic Thinking': 9,
    'Technical Understanding': 6,
    'Market Knowledge': 8,
    'Leadership Skills': 7,
    'Communication': 9,
    'Track Record': 8,
    'Analytical Skills': 7,
    'UX Focus': 8,
    'Cross-functional Collaboration': 9
  },
  'Priya Patel': {
    'Product Vision': 7,
    'Strategic Thinking': 8,
    'Technical Understanding': 8,
    'Market Knowledge': 7,
    'Leadership Skills': 8,
    'Communication': 8,
    'Track Record': 7,
    'Analytical Skills': 9,
    'UX Focus': 9,
    'Cross-functional Collaboration': 7
  },
  'David Johnson': {
    'Product Vision': 8,
    'Strategic Thinking': 7,
    'Technical Understanding': 9,
    'Market Knowledge': 8,
    'Leadership Skills': 7,
    'Communication': 7,
    'Track Record': 8,
    'Analytical Skills': 9,
    'UX Focus': 6,
    'Cross-functional Collaboration': 7
  },
  'Alexandra Kim': {
    'Product Vision': 8,
    'Strategic Thinking': 7,
    'Technical Understanding': 7,
    'Market Knowledge': 7,
    'Leadership Skills': 8,
    'Communication': 8,
    'Track Record': 6,
    'Analytical Skills': 8,
    'UX Focus': 9,
    'Cross-functional Collaboration': 8
  }
};

async function addCPOTestCase() {
  try {
    console.log('Adding "Hire a CPO" test case...');
    
    // Get all existing users for debugging
    const allUsers = await User.find();
    console.log(`Found ${allUsers.length} existing users:`, allUsers.map(u => ({ id: u._id, name: u.name, email: u.email })));
    
    // Get all existing topics for debugging
    const allTopics = await Topic.find();
    console.log(`Found ${allTopics.length} existing topics:`, allTopics.map(t => ({ id: t._id, name: t.name })));
    
    // Get existing users or create a new one
    let user = await User.findOne({ email: 'test@example.com' });
    
    if (!user) {
      console.log('Creating test user...');
      user = new User({
        name: 'Test User',
        email: 'test@example.com',
        topics: []
      });
      await user.save();
    } else {
      console.log('Found existing test user:', user);
    }
    
    // Create the CPO topic
    console.log('Creating CPO topic...');
    const topic = new Topic({
      name: 'Hire a CPO',
      description: 'Deciding on the best candidate for our Chief Product Officer position',
      participants: [user._id],
      currentPhase: 2 // Start in phase 2 to allow adding candidates
    });
    await topic.save();
    
    // Add topic to user's topics
    user.topics.push(topic._id);
    await user.save();
    
    // Create criteria
    console.log('Adding criteria for CPO hiring...');
    const criteriaMap = {};
    
    for (let i = 0; i < CPO_CRITERIA.length; i++) {
      const criterion = new Criterion({
        ...CPO_CRITERIA[i],
        topic: topic._id,
        user: user._id,
        rank: i + 1,
        isShared: true // All criteria are shared for this demo
      });
      
      const savedCriterion = await criterion.save();
      criteriaMap[savedCriterion.name] = savedCriterion._id;
    }
    
    // Create candidates
    console.log('Adding candidate profiles...');
    const candidateMap = {};
    
    for (const candidateData of CPO_CANDIDATES) {
      const candidate = new Candidate({
        ...candidateData,
        topic: topic._id,
        createdBy: user._id
      });
      
      const savedCandidate = await candidate.save();
      candidateMap[savedCandidate.name] = savedCandidate._id;
    }
    
    // Create evaluations
    console.log('Adding sample evaluations...');
    
    for (const [candidateName, scores] of Object.entries(DEMO_SCORES)) {
      const candidateId = candidateMap[candidateName];
      
      for (const [criterionName, score] of Object.entries(scores)) {
        const criterionId = criteriaMap[criterionName];
        
        const evaluation = new Evaluation({
          user: user._id,
          candidate: candidateId,
          criterion: criterionId,
          score: score,
          notes: `${score}/10 for ${candidateName} on ${criterionName}`
        });
        
        await evaluation.save();
      }
    }
    
    // Move the topic to phase 3
    topic.currentPhase = 3;
    await topic.save();
    
    console.log('Successfully created "Hire a CPO" test case!');
    console.log(`Topic ID: ${topic._id}`);
    console.log('You can now log in as test@example.com to access this topic');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating CPO test case:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the function
addCPOTestCase();
