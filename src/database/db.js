const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: 'postgresql://rickortygame_owner:npg_5Kwfsic8nNLl@ep-rapid-mode-a8529u6a-pooler.eastus2.azure.neon.tech/rickortygame?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Game progress table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        character VARCHAR(50) NOT NULL,
        affection_level INTEGER DEFAULT 0,
        current_emotion VARCHAR(50) DEFAULT 'neutral',
        nsfw_enabled BOOLEAN DEFAULT false,
        total_interactions INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, character)
      )
    `);

    // Chat history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        character VARCHAR(50) NOT NULL,
        user_input TEXT NOT NULL,
        character_response TEXT NOT NULL,
        emotion VARCHAR(50) DEFAULT 'neutral',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Character memories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS character_memories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        character VARCHAR(50) NOT NULL,
        memory_type VARCHAR(50) NOT NULL,
        memory_content TEXT NOT NULL,
        importance_score INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// User management functions
const createUser = async (username, email = null) => {
  try {
    const result = await pool.query(
      'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *',
      [username, email]
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error('Username already exists');
    }
    throw error;
  }
};

const getUserByUsername = async (username) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  }
};

const updateUserLogin = async (userId) => {
  try {
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  } catch (error) {
    throw error;
  }
};

// Game progress functions
const saveGameProgress = async (userId, character, progressData) => {
  try {
    const { affectionLevel, currentEmotion, nsfwEnabled, totalInteractions } = progressData;
    
    const result = await pool.query(`
      INSERT INTO game_progress (user_id, character, affection_level, current_emotion, nsfw_enabled, total_interactions, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, character)
      DO UPDATE SET
        affection_level = EXCLUDED.affection_level,
        current_emotion = EXCLUDED.current_emotion,
        nsfw_enabled = EXCLUDED.nsfw_enabled,
        total_interactions = EXCLUDED.total_interactions,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, character, affectionLevel, currentEmotion, nsfwEnabled, totalInteractions]);
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

const loadGameProgress = async (userId, character) => {
  try {
    const result = await pool.query(
      'SELECT * FROM game_progress WHERE user_id = $1 AND character = $2',
      [userId, character]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  }
};

const getAllUserProgress = async (userId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM game_progress WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Chat history functions
const saveChatMessage = async (userId, character, userInput, characterResponse, emotion) => {
  try {
    const result = await pool.query(`
      INSERT INTO chat_history (user_id, character, user_input, character_response, emotion)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, character, userInput, characterResponse, emotion]);
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

const getChatHistory = async (userId, character, limit = 50) => {
  try {
    const result = await pool.query(`
      SELECT * FROM chat_history 
      WHERE user_id = $1 AND character = $2 
      ORDER BY timestamp DESC 
      LIMIT $3
    `, [userId, character, limit]);
    
    return result.rows.reverse(); // Return in chronological order
  } catch (error) {
    throw error;
  }
};

const deleteChatHistory = async (userId, character) => {
  try {
    await pool.query(
      'DELETE FROM chat_history WHERE user_id = $1 AND character = $2',
      [userId, character]
    );
  } catch (error) {
    throw error;
  }
};

// Character memory functions
const saveCharacterMemory = async (userId, character, memoryType, memoryContent, importanceScore = 1) => {
  try {
    const result = await pool.query(`
      INSERT INTO character_memories (user_id, character, memory_type, memory_content, importance_score)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, character, memoryType, memoryContent, importanceScore]);
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

const getCharacterMemories = async (userId, character, limit = 20) => {
  try {
    const result = await pool.query(`
      SELECT * FROM character_memories 
      WHERE user_id = $1 AND character = $2 
      ORDER BY importance_score DESC, created_at DESC 
      LIMIT $3
    `, [userId, character, limit]);
    
    return result.rows;
  } catch (error) {
    throw error;
  }
};

const updateCharacterMemory = async (memoryId, memoryContent, importanceScore) => {
  try {
    const result = await pool.query(`
      UPDATE character_memories 
      SET memory_content = $1, importance_score = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3 
      RETURNING *
    `, [memoryContent, importanceScore, memoryId]);
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

const deleteCharacterMemory = async (memoryId) => {
  try {
    await pool.query('DELETE FROM character_memories WHERE id = $1', [memoryId]);
  } catch (error) {
    throw error;
  }
};

// Cleanup old data
const cleanupOldData = async (daysToKeep = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // Delete old chat history
    await pool.query(
      'DELETE FROM chat_history WHERE timestamp < $1',
      [cutoffDate]
    );
    
    // Delete low importance memories older than cutoff
    await pool.query(
      'DELETE FROM character_memories WHERE created_at < $1 AND importance_score < 3',
      [cutoffDate]
    );
    
    console.log('Old data cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
};

module.exports = {
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
  getCharacterMemories,
  updateCharacterMemory,
  deleteCharacterMemory,
  cleanupOldData,
  pool
};