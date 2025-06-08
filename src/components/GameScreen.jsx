import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Send, 
  Heart, 
  Settings, 
  User, 
  LogOut,
  Zap,
  MessageCircle,
  Atom,
  Brain
} from 'lucide-react'
import { useGame } from '../context/GameContext'
import { useDatabase } from '../context/DatabaseContext'
import { useGemini } from '../context/GeminiContext'
import CharacterSelect from './CharacterSelect'
import SettingsPanel from './Settings'

// Character images
import rickImg from '../assets/sprites/rick/rick.jpg'
import mortyImg from '../assets/sprites/morty/morty.jpg'
import rickPrimeImg from '../assets/sprites/rick_prime/RICKPRIME.webp'
import evilMortyImg from '../assets/sprites/evil_morty/evil-morty.png'

const GameScreen = () => {
  // Game context
  const {
    selectedCharacter,
    currentScreen,
    affectionLevel,
    currentEmotion,
    conversationHistory,
    conversationCount,
    nsfwEnabled,
    isLoading,
    selectCharacter,
    goToMenu,
    goToCharacterSelect,
    goToSettings,
    addToHistory,
    updateAffection,
    toggleNSFW
  } = useGame()

  // Database context
  const {
    currentUser,
    logoutUser
  } = useDatabase()

  // Gemini context
  const { generateResponse, error: geminiError } = useGemini()

  // Local state
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversationHistory])

  // Screen rendering logic
  const renderScreen = () => {
    switch (currentScreen) {
      case 'character-select':
        return (
          <CharacterSelect 
            onCharacterSelect={selectCharacter}
            onBack={goToMenu}
          />
        )
      case 'game':
        return renderGameInterface()
      case 'settings':
        return (
          <SettingsPanel 
            onBack={goToMenu}
          />
        )
      default:
        return renderMainMenu()
    }
  }

  const renderMainMenu = () => {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center portal-gradient portal-orbs"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        <div className="text-center max-w-2xl mx-auto px-6">
          {/* Header with user info */}
          <div className="absolute top-4 right-4 flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-black/50 rounded-lg px-3 py-2">
                <User size={16} className="text-green-400" />
                <span className="text-white text-sm">{currentUser.username}</span>
                <button
                  onClick={logoutUser}
                  className="text-red-400 hover:text-red-300"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="bg-black/50 rounded-lg px-3 py-2">
                <span className="text-gray-400 text-sm">Guest Mode</span>
              </div>
            )}
          </div>

          {/* Portal Logo */}
          <motion.div 
            className="relative mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="portal-glow mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-6">
              <Zap size={64} className="portal-text floating-portal" />
            </div>
            <h1 className="text-6xl font-bold portal-shadow-lg mb-4">
              <span className="rick-green">RICK</span>
              <span className="text-gray-400"> & </span>
              <span className="morty-yellow">MORTY</span>
            </h1>
            <h2 className="text-2xl portal-accent font-semibold">
              Interdimensional Dating Simulator
            </h2>
          </motion.div>

          {/* Menu Buttons */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.button
              className="portal-button w-full max-w-md mx-auto block"
              onClick={goToCharacterSelect}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap className="inline mr-2" size={20} />
              Start Adventure
            </motion.button>

            <motion.button
              className="portal-button w-full max-w-md mx-auto block bg-gradient-to-r from-gray-700 to-gray-600 text-portal-text"
              onClick={goToSettings}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Settings className="inline mr-2" size={20} />
              Settings
            </motion.button>
          </motion.div>

          {/* Portal Effects */}
          <motion.div 
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="portal-accent text-sm">
              "Wubba lubba dub dub! Time to get schwifty with some interdimensional romance!"
            </p>
            <div className="flex justify-center space-x-4 mt-4">
              <Heart className="portal-text" size={16} />
              <Zap className="morty-yellow" size={16} />
              <Settings className="portal-blue" size={16} />
            </div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  const renderGameInterface = () => {
    if (!selectedCharacter) return null

    return (
      <motion.div 
        className="min-h-screen portal-gradient portal-orbs flex flex-col"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
      >
        {/* Header */}
        <div className="bg-black/50 backdrop-blur-sm border-b border-portal-blue/30 p-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-4">
              <button
                onClick={goToMenu}
                className="portal-button-small"
              >
                <ArrowLeft size={16} />
                Menu
              </button>
              <div className="flex items-center space-x-2">
                <img 
                  src={getCharacterImage(selectedCharacter.id)} 
                  alt={selectedCharacter.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-white font-semibold">{selectedCharacter.name}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Affection Level */}
              <div className="flex items-center space-x-2">
                <Heart 
                  size={16} 
                  className={`${affectionLevel >= 20 ? 'text-red-500' : 'text-gray-400'}`}
                  fill={affectionLevel >= 20 ? 'currentColor' : 'none'}
                />
                <span className="text-white text-sm">{affectionLevel}%</span>
              </div>
              
              {/* NSFW Toggle */}
              <button
                onClick={toggleNSFW}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  nsfwEnabled 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                {nsfwEnabled ? '18+' : 'SFW'}
              </button>
              
              {/* Settings */}
              <button
                onClick={goToSettings}
                className="portal-button-small"
              >
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex max-w-6xl mx-auto w-full">
          {/* Character Display */}
          <div className="w-1/3 p-6 flex flex-col items-center justify-center">
            <motion.div 
              className="relative"
              animate={{ 
                scale: currentEmotion === 'excited' ? 1.05 : 1,
                rotate: currentEmotion === 'confused' ? [-1, 1, -1, 0] : 0
              }}
              transition={{ duration: 0.5 }}
            >
              <img 
                src={getCharacterImage(selectedCharacter.id)} 
                alt={selectedCharacter.name}
                className="w-64 h-64 object-cover rounded-lg portal-glow"
              />
              
              {/* Emotion Indicator */}
              <div className={`absolute top-2 right-2 w-4 h-4 rounded-full ${getEmotionColor(currentEmotion)}`}>
                {getEmotionIcon(currentEmotion)}
              </div>
            </motion.div>
            
            {/* Character Stats */}
            <div className="mt-6 text-center">
              <h3 className="text-xl font-bold text-white mb-2">{selectedCharacter.name}</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Affection:</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${affectionLevel}%` }}
                      />
                    </div>
                    <span className="text-white">{affectionLevel}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Conversations:</span>
                  <span className="text-white">{conversationCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col p-6">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96">
              {conversationHistory.map((message, index) => (
                <motion.div
                  key={message.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-portal-blue text-white'
                      : 'bg-gray-800 text-portal-text border border-portal-blue/30'
                  }`}>
                    <div className="text-sm">
                      {formatMessage(message.content)}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-800 text-portal-text border border-portal-blue/30 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-portal-blue rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-portal-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-portal-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
                placeholder={`Message ${selectedCharacter?.name}...`}
                className="flex-1 bg-gray-800 border border-portal-blue/30 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-portal-blue"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping}
                className="portal-button px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const getCharacterImage = (characterId) => {
    const images = {
      rick: rickImg,
      morty: mortyImg,
      rickprime: rickPrimeImg,
      evilmorty: evilMortyImg
    }
    return images[characterId] || rickImg
  }

  const formatMessage = (content) => {
    const safeContent = typeof content === 'string' ? content : ''
    return safeContent.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < safeContent.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: 'bg-yellow-400',
      sad: 'bg-blue-400',
      angry: 'bg-red-400',
      excited: 'bg-green-400',
      confused: 'bg-purple-400',
      neutral: 'bg-gray-400'
    }
    return colors[emotion] || colors.neutral
  }

  const getEmotionIcon = (emotion) => {
    const icons = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      excited: '🤩',
      confused: '😕',
      neutral: '😐'
    }
    return icons[emotion] || icons.neutral
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedCharacter) return;

    setIsTyping(true);
    addToHistory(input, null, null); // Add user message (userInput is input, characterResponse is null)

    try {
      if (!selectedCharacter || !selectedCharacter.id) {
        console.error('CRITICAL: Selected character or character ID is missing before generateResponse.');
        throw new Error('Selected character or character ID is missing.');
      }

      console.log('GameScreen: Preparing to call generateResponse.');
      console.log('GameScreen: selectedCharacter:', selectedCharacter);
      console.log('GameScreen: selectedCharacter.id:', selectedCharacter.id);
      console.log('GameScreen: typeof selectedCharacter.id:', typeof selectedCharacter.id);
      
      // Make sure we're passing the character ID as a string, not the entire character object
      const characterId = String(selectedCharacter.id);
      console.log('GameScreen: characterId to be passed:', characterId);
      
      const response = await generateResponse(characterId, input);
      addToHistory(null, response, currentEmotion); // Add AI response (userInput is null, characterResponse is response)

    } catch (error) {
      console.error('Error in handleSendMessage during/after generateResponse:', error);
      addToHistory(null, "*glitches* Sorry, something went wrong with the interdimensional communication...", 'confused');
    }

    setInput('');
    setIsTyping(false);
  };

  if (isLoading) {
    console.log('GameScreen: isLoading is true, showing loading screen')
    return (
      <div className="min-h-screen flex items-center justify-center portal-gradient">
        <div className="text-center">
          <div className="portal-glow w-16 h-16 rounded-full bg-portal-blue mx-auto mb-4 animate-pulse" />
          <p className="text-portal-text">Loading interdimensional portal...</p>
        </div>
      </div>
    )
  }

  if (geminiError) {
    console.log('GameScreen: geminiError detected:', geminiError)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-400 text-center">
        <div>
          <h2 className="text-2xl font-bold mb-4">An error occurred</h2>
          <p>{geminiError}</p>
          <p className="mt-4">Please check your API key settings or try again later.</p>
        </div>
      </div>
    )
  }

  console.log('GameScreen: Rendering normal screen, conversationHistory length:', conversationHistory.length)
  return renderScreen()
}

export default GameScreen