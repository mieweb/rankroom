const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Add cache-control headers to prevent browser caching
app.use((req, res, next) => {
  // Set cache control headers for all API responses
  if (req.url.includes('/api/') || req.url.includes('/demo/')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import config
const config = require('./config/config');

// Database connection
mongoose.connect(config.database.uri, config.database.options || {})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Import routes
const topicRoutes = require('./routes/topicRoutes');
const userRoutes = require('./routes/userRoutes');
const criteriaRoutes = require('./routes/criteriaRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const demoRoutes = require('./routes/demoRoutes');

// Use routes
app.use('/api/topics', topicRoutes);
app.use('/api/users', userRoutes);
app.use('/api/criteria', criteriaRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/demo', demoRoutes);

// Main route to serve the front-end
app.get('/', (req, res) => {
  res.render('index');
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

// Topic route
app.get('/topics/:topicId', (req, res) => {
  res.render('topic');
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('joinTopic', (topicId) => {
    socket.join(topicId);
    console.log(`Client joined topic: ${topicId}`);
  });
  
  socket.on('newCriterion', (data) => {
    socket.to(data.topicId).emit('criterionAdded', data);
  });
  
  socket.on('newCandidate', (data) => {
    socket.to(data.topicId).emit('candidateAdded', data);
  });
  
  socket.on('newEvaluation', (data) => {
    socket.to(data.topicId).emit('evaluationAdded', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = config.server.port;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
