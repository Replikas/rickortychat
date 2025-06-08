const express = require('express');
const path = require('path');
const {
  initializeDatabase,
  createUser,
  getUserByUsername,
  updateUserLogin,
  saveGameProgress,
  loadGameProgress,
  getAllUserProgress,
  saveChatMessage,
  getChatHistory,
  deleteChatHistory,
  saveCharacterMemory,
  getCharacterMemories
} = require('./src/database/db.js');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize database on startup
initializeDatabase().then(() => {
  console.log('Database initialized successfully');
}).catch(err => {
  console.error('Database initialization failed:', err);
});

// API Routes

// Initialize database endpoint
app.post('/api/init', async (req, res) => {
  try {
    await initializeDatabase();
    res.json({ success: true });
  } catch (error) {
    console.error('Database initialization failed:', error);
    res.status(500).json({ error: 'Failed to initialize database' });
  }
});

// Simple chat endpoint (without Puppeteer)
app.post('/api/chat', async (req, res) => {
  const { message, character } = req.body;
  
  // Simple fallback responses for testing
  const responses = {
    rick: "*burp* Yeah, whatever Morty. Science!",
    morty: "Aw geez, that's interesting I guess...",
    evilmorty: "How predictably mundane.",
    rickprime: "I've seen better conversations in parallel dimensions."
  };
  
  const response = responses[character] || "Character not available.";
  res.json({ response });
});

// User routes
app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await getUserByUsername(req.params.username);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Get user failed:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await createUser(username, email);
    res.json(user);
  } catch (error) {
    console.error('Create user failed:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/api/users/:userId/login', async (req, res) => {
  try {
    const result = await updateUserLogin(req.params.userId);
    res.json(result);
  } catch (error) {
    console.error('Update login failed:', error);
    res.status(500).json({ error: 'Failed to update login' });
  }
});

// Game progress routes
app.get('/api/progress/:userId/:character', async (req, res) => {
  try {
    const { userId, character } = req.params;
    const progress = await loadGameProgress(userId, character);
    res.json(progress);
  } catch (error) {
    console.error('Load progress failed:', error);
    res.status(500).json({ error: 'Failed to load progress' });
  }
});

app.post('/api/progress', async (req, res) => {
  try {
    const { userId, character, affectionLevel, currentEmotion, nsfwEnabled, totalInteractions } = req.body;
    const result = await saveGameProgress(userId, character, affectionLevel, currentEmotion, nsfwEnabled, totalInteractions);
    res.json(result);
  } catch (error) {
    console.error('Save progress failed:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

app.get('/api/admin/progress', async (req, res) => {
  try {
    const progress = await getAllUserProgress();
    res.json(progress);
  } catch (error) {
    console.error('Get all progress failed:', error);
    res.status(500).json({ error: 'Failed to get progress data' });
  }
});

// Chat history routes
app.get('/api/chat-history/:userId/:character', async (req, res) => {
  try {
    const { userId, character } = req.params;
    const history = await getChatHistory(userId, character);
    res.json(history);
  } catch (error) {
    console.error('Get chat history failed:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

app.post('/api/chat-history', async (req, res) => {
  try {
    const { userId, character, userInput, characterResponse, emotion } = req.body;
    const result = await saveChatMessage(userId, character, userInput, characterResponse, emotion);
    res.json(result);
  } catch (error) {
    console.error('Save chat message failed:', error);
    res.status(500).json({ error: 'Failed to save chat message' });
  }
});

app.delete('/api/chat-history/:userId/:character', async (req, res) => {
  try {
    const { userId, character } = req.params;
    const result = await deleteChatHistory(userId, character);
    res.json(result);
  } catch (error) {
    console.error('Delete chat history failed:', error);
    res.status(500).json({ error: 'Failed to delete chat history' });
  }
});

// Memory routes
app.post('/api/memory', async (req, res) => {
  try {
    const { userId, character, memory } = req.body;
    const result = await saveCharacterMemory(userId, character, 'general', memory, 1);
    res.json(result);
  } catch (error) {
    console.error('Save memory failed:', error);
    res.status(500).json({ error: 'Failed to save memory' });
  }
});

app.get('/api/memory/:userId/:character', async (req, res) => {
  try {
    const { userId, character } = req.params;
    const memories = await getCharacterMemories(userId, character);
    res.json(memories);
  } catch (error) {
    console.error('Load memories failed:', error);
    res.status(500).json({ error: 'Failed to load memories' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Handle React Router - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
});