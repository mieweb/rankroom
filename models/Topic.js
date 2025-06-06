const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  currentPhase: {
    type: Number,
    default: 1, // 1: Definition, 2: Collection, 3: Decision
    min: 1,
    max: 3
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

module.exports = mongoose.model('Topic', TopicSchema);
