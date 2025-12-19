require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const questionsRouter = require('./routes/questions');
const progressRouter = require('./routes/progress');
const audioRouter = require('./routes/audio');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', questionsRouter);
app.use('/api', progressRouter);
app.use('/audio', audioRouter);

// Serve static audio files
app.use('/audio', express.static(path.join(__dirname, '../public/audio')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// robots.txt - prevent indexing
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Municipality Learner API running on port ${PORT}`);
});
