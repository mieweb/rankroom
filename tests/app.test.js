/**
 * Basic smoke tests for the collaborative decision maker application
 */

// Mock mongoose connection to avoid database dependency in tests
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(true),
  connection: {
    on: jest.fn(),
    once: jest.fn()
  },
  Schema: function(definition) {
    this.definition = definition;
    this.index = jest.fn();
    this.pre = jest.fn();
    this.post = jest.fn();
    this.virtual = jest.fn().mockReturnValue({
      get: jest.fn(),
      set: jest.fn()
    });
    return this;
  },
  model: jest.fn().mockImplementation((name, schema) => {
    return function MockModel() {};
  })
}));

// Add Schema.Types after creating the mock
const mongoose = require('mongoose');
mongoose.Schema.Types = {
  ObjectId: 'ObjectId',
  String: String,
  Number: Number,
  Date: Date,
  Boolean: Boolean
};

describe('Application', () => {
  beforeAll(() => {
    // Suppress console.log during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    console.log.mockRestore();
  });

  describe('Configuration', () => {
    test('should load config without errors', () => {
      expect(() => {
        require('../config/config');
      }).not.toThrow();
    });

    test('config should have required properties', () => {
      const config = require('../config/config');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('server');
      expect(config).toHaveProperty('session');
      expect(config.database).toHaveProperty('uri');
      expect(config.server).toHaveProperty('port');
    });
  });

  describe('Models', () => {
    test('should import all models without errors', () => {
      expect(() => {
        require('../models/Topic');
        require('../models/User');
        require('../models/Criterion');
        require('../models/Candidate');
        require('../models/Evaluation');
      }).not.toThrow();
    });
  });

  describe('Routes', () => {
    test('should import all routes without errors', () => {
      expect(() => {
        require('../routes/topicRoutes');
        require('../routes/userRoutes');
        require('../routes/criteriaRoutes');
        require('../routes/candidateRoutes');
        require('../routes/evaluationRoutes');
        require('../routes/demoRoutes');
      }).not.toThrow();
    });
  });

  describe('Basic functionality', () => {
    test('package.json should have correct structure', () => {
      const pkg = require('../package.json');
      expect(pkg.name).toBe('collaborative-decision-maker');
      expect(pkg.main).toBe('server.js');
      expect(pkg.scripts).toHaveProperty('start');
      expect(pkg.scripts).toHaveProperty('test');
    });
  });
});