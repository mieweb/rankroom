const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const User = require('../models/User');
const Criterion = require('../models/Criterion');
const Candidate = require('../models/Candidate');
const Evaluation = require('../models/Evaluation');
const CandidateRanking = require('../models/CandidateRanking');

console.log('Loading demo routes...');

// Demo data constants
const DEMO_USERS = [
  { name: 'Alice Johnson', email: 'alice@example.com' },
  { name: 'Bob Smith', email: 'bob@example.com' },
  { name: 'Carol Davis', email: 'carol@example.com' },
  { name: 'Dave Wilson', email: 'dave@example.com' }
];

const DEMO_TOPICS = [
  {
    name: 'Hire a CPO',
    description: 'Deciding on the best candidate for our Chief Product Officer position'
  },
  {
    name: 'New Office Location',
    description: 'Deciding on a new office location for the company'
  },
  {
    name: 'Software Vendor Selection',
    description: 'Choosing a vendor for our new CRM system'
  },
  {
    name: 'Department Budget Allocation',
    description: 'Allocating budget across departments for the next fiscal year'
  }
];

console.log('DEMO_TOPICS:', JSON.stringify(DEMO_TOPICS));

const DEMO_CRITERIA = {
  'Hire a CPO': [
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
  ],
  'New Office Location': [
    { name: 'Cost per square foot', description: 'Monthly rent cost per square foot' },
    { name: 'Commute time', description: 'Average commute time for employees' },
    { name: 'Amenities', description: 'Nearby restaurants, gyms, etc.' },
    { name: 'Public transport', description: 'Accessibility by public transportation' },
    { name: 'Parking', description: 'Available parking spaces' },
    { name: 'Size', description: 'Total square footage' },
    { name: 'Meeting rooms', description: 'Number of available meeting rooms' },
    { name: 'Natural light', description: 'Amount of natural light in the space' }
  ],
  'Software Vendor Selection': [
    { name: 'Cost', description: 'Total cost including implementation and training' },
    { name: 'Features', description: 'Available features that meet our requirements' },
    { name: 'Ease of use', description: 'User-friendliness of the interface' },
    { name: 'Support', description: 'Quality of customer support' },
    { name: 'Integration', description: 'Ability to integrate with existing systems' },
    { name: 'Scalability', description: 'Ability to scale with company growth' },
    { name: 'Security', description: 'Security features and compliance' },
    { name: 'Customization', description: 'Ability to customize to our needs' }
  ],
  'Department Budget Allocation': [
    { name: 'ROI', description: 'Expected return on investment' },
    { name: 'Strategic alignment', description: 'Alignment with company strategy' },
    { name: 'Team size', description: 'Number of employees in the department' },
    { name: 'Current performance', description: 'Current performance of the department' },
    { name: 'Growth potential', description: 'Potential for growth in the department' },
    { name: 'Resource needs', description: 'Specific resource needs of the department' },
    { name: 'Past budget utilization', description: 'How effectively past budgets were used' },
    { name: 'Innovation potential', description: 'Potential for innovation in the department' }
  ]
};

const DEMO_CANDIDATES = {
  'Hire a CPO': [
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
  ],
  'New Office Location': [
    { name: 'Downtown Office Tower', description: 'Central location in the downtown core, 12th floor' },
    { name: 'Suburban Office Park', description: 'Modern office in a suburban business park with free parking' },
    { name: 'Tech Hub', description: 'Office in the city\'s technology district with many tech companies nearby' },
    { name: 'Waterfront Building', description: 'Renovated building with views of the waterfront' }
  ],
  'Software Vendor Selection': [
    { name: 'VendorTech CRM', description: 'Established vendor with comprehensive features' },
    { name: 'CloudCRM Solutions', description: 'Cloud-based CRM with modern interface' },
    { name: 'EasyConnect', description: 'Simple, user-friendly CRM system with good support' },
    { name: 'Enterprise CRM Pro', description: 'Enterprise-level CRM with extensive customization options' }
  ],
  'Department Budget Allocation': [
    { name: 'Marketing Department', description: 'Responsible for brand awareness and lead generation' },
    { name: 'R&D Department', description: 'Focuses on product innovation and development' },
    { name: 'Sales Department', description: 'Drives revenue through client acquisition and retention' },
    { name: 'Operations Department', description: 'Handles day-to-day business operations and logistics' },
    { name: 'IT Department', description: 'Manages technology infrastructure and software development' }
  ]
};

// Initialize a demo environment
router.post('/init', async (req, res) => {
  try {
    console.log('=== DEMO INITIALIZATION STARTING ===');
    console.log('DEMO_TOPICS:', JSON.stringify(DEMO_TOPICS));
    
    // Reset all collections
    await Topic.deleteMany({});
    await User.deleteMany({});
    await Criterion.deleteMany({});
    await Candidate.deleteMany({});
    await Evaluation.deleteMany({});
    await CandidateRanking.deleteMany({});
    
    console.log('All collections reset');
    
    // Create demo users
    const createdUsers = [];
    for (const demoUser of DEMO_USERS) {
      const user = new User(demoUser);
      await user.save();
      createdUsers.push(user);
    }
    
    console.log('Created demo users:', createdUsers.map(u => u.name));
    
    // Create demo topics and add all users as participants
    const createdTopics = [];
    for (const demoTopic of DEMO_TOPICS) {
      console.log('Creating demo topic:', demoTopic.name);
      const topic = new Topic({
        ...demoTopic,
        participants: createdUsers.map(u => u._id)
      });
      await topic.save();
      createdTopics.push(topic);
      
      // Update users with this topic
      for (const user of createdUsers) {
        console.log(`Adding topic ${topic._id} (${topic.name}) to user ${user.name}`);
        user.topics.push(topic._id);
        await user.save();
      }
    }
    
    console.log('Created demo topics:', createdTopics.map(t => t.name));
    
    // Create criteria for each topic
    for (const topic of createdTopics) {
      const topicName = topic.name;
      const criteriaSets = DEMO_CRITERIA[topicName];
      
      if (criteriaSets) {
        for (let i = 0; i < createdUsers.length; i++) {
          const user = createdUsers[i];
          
          // Each user gets a different subset of criteria, with some overlap
          const startIdx = i * 2 % criteriaSets.length;
          const endIdx = startIdx + 4 > criteriaSets.length ? criteriaSets.length : startIdx + 4;
          
          const userCriteria = criteriaSets.slice(startIdx, endIdx);
          
          for (let j = 0; j < userCriteria.length; j++) {
            const criterion = new Criterion({
              ...userCriteria[j],
              topic: topic._id,
              user: user._id,
              rank: j + 1,
              isShared: j < 2 // First two criteria for each user are shared
            });
            
            await criterion.save();
          }
        }
      }
    }
    
    // Set all topics to phase 2 to allow candidates
    for (const topic of createdTopics) {
      topic.currentPhase = 2;
      await topic.save();
      
      // Create candidates for each topic
      const topicName = topic.name;
      const candidateSets = DEMO_CANDIDATES[topicName];
      
      if (candidateSets) {
        for (let i = 0; i < candidateSets.length; i++) {
          // Distribute candidate creation among users
          const user = createdUsers[i % createdUsers.length];
          
          const candidate = new Candidate({
            ...candidateSets[i],
            topic: topic._id,
            createdBy: user._id
          });
          
          await candidate.save();
        }
      }
    }
    
    // Create evaluations for each user on each candidate using their criteria
    for (const topic of createdTopics) {
      // Get all candidates for this topic
      const candidates = await Candidate.find({ topic: topic._id });
      
      for (const user of createdUsers) {
        // Get criteria for this user in this topic
        const criteria = await Criterion.find({ 
          topic: topic._id,
          user: user._id
        });
        
        for (const candidate of candidates) {
          for (const criterion of criteria) {
            // Generate a random score between 1 and 10
            const score = Math.floor(Math.random() * 10) + 1;
            
            const evaluation = new Evaluation({
              user: user._id,
              candidate: candidate._id,
              criterion: criterion._id,
              score,
              notes: `Demo evaluation from ${user.name}`
            });
            
            await evaluation.save();
          }
        }
      }
    }
    
    // Set the first topic to phase 3
    const firstTopic = createdTopics[0];
    firstTopic.currentPhase = 3;
    await firstTopic.save();
    
    // Also set the "Hire a CPO" topic to phase 3 if it exists
    const cpoTopic = createdTopics.find(t => t.name === 'Hire a CPO');
    if (cpoTopic) {
      cpoTopic.currentPhase = 3;
      await cpoTopic.save();
    }
    
    // Create rankings for each user for the first topic
    const firstTopicCandidates = await Candidate.find({ topic: firstTopic._id });
    
    for (const user of createdUsers) {
      // Shuffle candidates to create different rankings for each user
      const shuffledCandidates = [...firstTopicCandidates].sort(() => 0.5 - Math.random());
      
      const rankings = shuffledCandidates.map((candidate, index) => ({
        candidate: candidate._id,
        rank: index + 1
      }));
      
      const candidateRanking = new CandidateRanking({
        user: user._id,
        topic: firstTopic._id,
        rankings
      });
      
      await candidateRanking.save();
    }
    
    res.status(200).json({
      message: 'Demo environment initialized successfully',
      users: createdUsers,
      topics: createdTopics
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset demo data
router.post('/reset', async (req, res) => {
  try {
    // Reset all collections
    await Topic.deleteMany({});
    await User.deleteMany({});
    await Criterion.deleteMany({});
    await Candidate.deleteMany({});
    await Evaluation.deleteMany({});
    await CandidateRanking.deleteMany({});
    
    res.status(200).json({ message: 'Demo environment reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
