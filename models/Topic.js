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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  phaseAdvancedAt: {
    type: Date
  },
  settings: {
    allowCriteriaCollaboration: {
      type: Boolean,
      default: true
    },
    hideEvaluationsDuringCollection: {
      type: Boolean,
      default: true
    }
  }
});

module.exports = mongoose.model('Topic', TopicSchema);
