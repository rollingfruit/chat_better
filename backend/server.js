require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const scenarioRoutes = require('./routes/scenarios');
const chatRoutes = require('./routes/chat');
const reviewRoutes = require('./routes/review');
const SessionManager = require('./utils/sessionManager');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize session manager
const sessionManager = new SessionManager();

// Middleware
app.use(cors({
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Make session manager available to routes
app.use((req, res, next) => {
  req.sessionManager = sessionManager;
  next();
});

// Routes
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/chat-stream', chatRoutes);
app.use('/api/review', reviewRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    activeSessions: sessionManager.getActiveSessionCount()
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  sessionManager.cleanup();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend available on http://localhost:3001`);
  console.log(`🔑 OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? 'Configured' : 'Missing!'}`);
});