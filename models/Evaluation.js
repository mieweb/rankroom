const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  criterion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Criterion',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a user can only evaluate a candidate on a criterion once
EvaluationSchema.index({ user: 1, candidate: 1, criterion: 1 }, { unique: true });

module.exports = mongoose.model('Evaluation', EvaluationSchema);
