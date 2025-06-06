// This file contains configuration settings for the application
// In a production environment, these would be stored in environment variables

module.exports = {
  // MongoDB connection settings
  database: {
    // Use environment variable or default to localhost
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/decision-maker',
    options: {
      // Removed deprecated options that are no longer needed in MongoDB driver v4+
    }
  },
  
  // Server settings
  server: {
    port: process.env.PORT || 32000
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'decision-maker-secret',
    resave: false,
    saveUninitialized: false
  }
};
