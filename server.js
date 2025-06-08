const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer'); // Add this line
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

// Character URL mapping for HammerAI
const characterUrls = {
  rick: 'https://www.hammerai.com/chat?id=0ba0dbd8-11df-474f-8c97-a081720a8ac5&secret=8c877713-4601-4169-9044-b3361703484c',
  morty: 'https://www.hammerai.com/chat?id=dc226cf2-5e24-41ff-8f3d-284ca41eb783&secret=3a9b9201-9601-4202-81ae-a0b2bb27022c',
  rickprime: 'https://www.hammerai.com/chat?id=53c8c795-fd65-47c6-a49d-1517f8e969d9&secret=f0982b21-bec7-47c7-a0ea-cf47e54a503d',
  evilmorty: 'https://www.hammerai.com/chat?id=6b14a931-16d6-4fe5-a476-5f93640b5e08&secret=15c9c9f8-f5f9-48c7-b435-8768168874da'
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// HammerAI Chat Integration - Add this before the existing API routes
app.post('/api/hammerai-chat', async (req, res) => {
  const { message, character } = req.body;
  const characterUrl = characterUrls[character];
  
  if (!characterUrl) {
    return res.status(400).json({ error: 'Unknown character' });
  }
  
  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Navigate to character chat
    await page.goto(characterUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait for page load
    await page.waitForTimeout(3000);
    
    // Handle age verification if present
    try {
      const enterButton = await page.$('button');
      if (enterButton) {
        const buttonText = await page.evaluate(el => el.textContent, enterButton);
        if (buttonText && buttonText.toLowerCase().includes('enter')) {
          await enterButton.click();
          await page.waitForTimeout(2000);
        }
      }
    } catch (e) {
      // Age verification might not be present
    }
    
    // Find and fill input field
    const inputSelectors = [
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="type"]',
      'input[type="text"]',
      'textarea',
      '.chat-input',
      '#message-input'
    ];
    
    let inputFound = false;
    for (const selector of inputSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        await page.click(selector);
        await page.type(selector, message);
        inputFound = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!inputFound) {
      throw new Error('Could not find message input field');
    }
    
    // Find and click send button
    const sendSelectors = [
      'button[type="submit"]',
      'button[aria-label*="send"]',
      'button[aria-label*="Send"]',
      'button:has(svg)',
      '.send-button'
    ];
    
    let sendFound = false;
    for (const selector of sendSelectors) {
      try {
        await page.click(selector);
        sendFound = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!sendFound) {
      await page.keyboard.press('Enter');
    }
    
    // Wait for response
    await page.waitForTimeout(8000);
    
    // Get response
    const responseSelectors = [
      '.message:last-child',
      '.chat-message:last-child',
      '[data-role="assistant"]:last-child',
      '.ai-message:last-child'
    ];
    
    let response = null;
    for (const selector of responseSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          const lastElement = elements[elements.length - 1];
          response = await page.evaluate(el => el.textContent, lastElement);
          if (response && response.trim().length > 0 && !response.includes(message)) {
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    await browser.close();
    
    if (!response || response.trim().length === 0) {
      throw new Error('No response received');
    }
    
    res.json({ response: response.trim() });
    
  } catch (error) {
    console.error('HammerAI Error:', error);
    
    const fallbacks = {
      rick: "*burp* Sorry Morty, I'm having some technical difficulties.",
      morty: "Aw geez, I-I'm having some trouble right now, y'know?",
      evilmorty: "Technical difficulties. How predictable.",
      rickprime: "Even I have limits, apparently."
    };
    
    res.json({ 
      response: fallbacks[character] || "*Character is temporarily unavailable*"
    });
  }
});

// API Routes

// Initialize database
app.post('/api/init', async (req, res) => {
  try {
    await initializeDatabase();
    res.json({ success: true });
  } catch (error) {
    console.error('Database initialization failed:', error);
    res.status(500).json({ error: 'Failed to initialize database' });
  }
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
    const { username } = req.body;
    const user = await createUser(username);
    res.json(user);
  } catch (error) {
    console.error('Create user failed:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/api/users/:id/login', async (req, res) => {
  try {
    await updateUserLogin(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Update login failed:', error);
    res.status(500).json({ error: 'Failed to update login' });
  }
});

// Progress routes
app.post('/api/progress', async (req, res) => {
  try {
    const { userId, character, progress } = req.body;
    const result = await saveGameProgress(userId, character, progress);
    res.json(result);
  } catch (error) {
    console.error('Save progress failed:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

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

app.get('/api/progress/:userId', async (req, res) => {
  try {
    const progress = await getAllUserProgress(req.params.userId);
    res.json(progress);
  } catch (error) {
    console.error('Load all progress failed:', error);
    res.status(500).json({ error: 'Failed to load progress' });
  }
});

// Chat routes
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, character, message, isUser } = req.body;
    // Backend validation for character length
    if (typeof character !== 'string' || character.length > 50) {
      return res.status(400).json({ error: 'Character ID too long or invalid.' });
    }
    // Prevent guests from saving chat messages
    if (!userId) {
      return res.status(403).json({ error: 'Guests are not allowed to save chat messages.' });
    }
    const result = await saveChatMessage(userId, character, message, '', 'neutral');
    res.json(result);
  } catch (error) {
    console.error('Save chat failed:', error);
    res.status(500).json({ error: 'Failed to save chat' });
  }
});

app.get('/api/chat/:userId/:character', async (req, res) => {
  try {
    const { userId, character } = req.params;
    const history = await getChatHistory(userId, character);
    res.json(history);
  } catch (error) {
    console.error('Load chat history failed:', error);
    res.status(500).json({ error: 'Failed to load chat history' });
  }
});

app.delete('/api/chat/:userId/:character', async (req, res) => {
  try {
    const { userId, character } = req.params;
    await deleteChatHistory(userId, character);
    res.json({ success: true });
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

// Handle React Router - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});