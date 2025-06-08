import React, { createContext, useContext, useState, useEffect } from 'react'
import { useDatabase } from './DatabaseContext'

const GameContext = createContext()

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

export const GameProvider = ({ children }) => {
  const [conversationHistory, setConversationHistory] = useState([])
  const [affectionLevel, setAffectionLevel] = useState(0)
  const [currentEmotion, setCurrentEmotion] = useState('neutral')
  const [nsfwEnabled, setNsfwEnabled] = useState(false)
  const [totalInteractions, setTotalInteractions] = useState(0)
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [currentScreen, setCurrentScreen] = useState('menu')
  const [isLoading, setIsLoading] = useState(false)
  
  const { 
    currentUser, 
    loadProgress, 
    saveProgress, 
    loadChatHistory, 
    saveChatToHistory, 
    autoSave,
    loadMemories,
    saveMemory
  } = useDatabase()

  // Load character progress when character is selected
  useEffect(() => {
    const loadCharacterData = async () => {
      if (!selectedCharacter || !currentUser) return
      
      setIsLoading(true)
      try {
        // Load progress
        const progress = await loadProgress(selectedCharacter.id)
        if (progress) {
          setAffectionLevel(progress.affection_level || 0)
          setCurrentEmotion(progress.current_emotion || 'neutral')
          setNsfwEnabled(progress.nsfw_enabled || false)
          setTotalInteractions(progress.total_interactions || 0)
        }
        
        // Load chat history
        const history = await loadChatHistory(selectedCharacter.id, 50)
        const formattedHistory = history.map(chat => ({
          userInput: chat.user_input,
          response: chat.character_response,
          emotion: chat.emotion,
          timestamp: chat.timestamp
        }))
        setConversationHistory(formattedHistory)
      } catch (error) {
        console.error('Failed to load character data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCharacterData()
  }, [selectedCharacter, currentUser, loadProgress, loadChatHistory])

  // Auto-save progress periodically
  useEffect(() => {
    if (!selectedCharacter || !currentUser) return

    const saveInterval = setInterval(() => {
      autoSave(selectedCharacter.id, {
        affectionLevel,
        currentEmotion,
        nsfwEnabled,
        totalInteractions
      })
    }, 30000) // Save every 30 seconds

    return () => clearInterval(saveInterval)
  }, [selectedCharacter, currentUser, affectionLevel, currentEmotion, nsfwEnabled, totalInteractions, autoSave])

  const selectCharacter = (character) => {
    setSelectedCharacter(character)
    setCurrentScreen('game')
  }

  const updateAffection = async (amount) => {
    const newLevel = Math.max(0, Math.min(100, affectionLevel + amount))
    setAffectionLevel(newLevel)
    
    // Save progress immediately on affection change
    if (selectedCharacter && currentUser) {
      try {
        await saveProgress(selectedCharacter.id, {
          affectionLevel: newLevel,
          currentEmotion,
          nsfwEnabled,
          totalInteractions
        })
      } catch (error) {
        console.error('Failed to save progress:', error)
      }
    }
  }

  const addToHistory = async (userInput, characterResponse, emotion) => {
    console.log('addToHistory called with:', { userInput, characterResponse, emotion })
    console.log('Current conversationHistory length:', conversationHistory.length)
    
    // Add user message if userInput is provided
    if (userInput) {
      const userMessage = {
        id: Date.now(),
        sender: 'user',
        content: userInput,
        timestamp: new Date()
      }
      console.log('Adding user message:', userMessage)
      setConversationHistory(prev => {
        console.log('Previous conversation history:', prev)
        const newHistory = [...prev, userMessage]
        console.log('New conversation history after user message:', newHistory)
        return newHistory
      })
    }
    
    // Add character response if characterResponse is provided
    if (characterResponse) {
      const characterMessage = {
        id: Date.now() + 1,
        sender: 'character',
        content: characterResponse,
        timestamp: new Date(),
        emotion: emotion || 'neutral'
      }
      console.log('Adding character message:', characterMessage)
      setConversationHistory(prev => {
        console.log('Previous conversation history:', prev)
        const newHistory = [...prev, characterMessage]
        console.log('New conversation history after character message:', newHistory)
        return newHistory
      })
    }
    
    setTotalInteractions(prev => prev + 1)
    
    // Save to database if user is logged in
    if (selectedCharacter && currentUser && userInput && characterResponse) {
      try {
        console.log('Saving chat to database...')
        // Ensure character ID is a string
        const characterId = typeof selectedCharacter.id === 'string' 
          ? selectedCharacter.id 
          : String(selectedCharacter.id);
        
        console.log('Using character ID for database:', characterId)
        await saveChatToHistory(characterId, userInput, true)
        await saveChatToHistory(characterId, characterResponse, false)
        console.log('Chat saved to database successfully')
      } catch (error) {
        console.error('Failed to save chat:', error)
      }
    }
  }

  const setEmotion = (emotion) => {
    setCurrentEmotion(emotion)
  }

  const toggleNSFW = async () => {
    const newNsfwState = !nsfwEnabled
    setNsfwEnabled(newNsfwState)
    
    // Save immediately
    if (selectedCharacter && currentUser) {
      try {
        await saveProgress(selectedCharacter.id, {
          affectionLevel,
          currentEmotion,
          nsfwEnabled: newNsfwState,
          totalInteractions
        })
      } catch (error) {
        console.error('Failed to save NSFW setting:', error)
      }
    }
  }

  const resetCharacterProgress = async () => {
    setAffectionLevel(0)
    setCurrentEmotion('neutral')
    setTotalInteractions(0)
    setConversationHistory([])
    
    // Save reset state
    if (selectedCharacter && currentUser) {
      try {
        await saveProgress(selectedCharacter.id, {
          affectionLevel: 0,
          currentEmotion: 'neutral',
          nsfwEnabled,
          totalInteractions: 0
        })
      } catch (error) {
        console.error('Failed to save reset progress:', error)
      }
    }
  }

  const goToMenu = () => {
    setCurrentScreen('menu')
    setSelectedCharacter(null)
  }

  const goToCharacterSelect = () => {
    setCurrentScreen('character-select')
    setSelectedCharacter(null)
  }

  const goToSettings = () => {
    setCurrentScreen('settings')
  }

  const value = {
    // State
    conversationHistory,
    affectionLevel,
    currentEmotion,
    nsfwEnabled,
    totalInteractions,
    selectedCharacter,
    currentScreen,
    isLoading,
    
    // Actions
    selectCharacter,
    updateAffection,
    addToHistory,
    setEmotion,
    toggleNSFW,
    resetCharacterProgress,
    
    // Navigation
    goToMenu,
    goToCharacterSelect,
    goToSettings,
    setCurrentScreen,
    
    // Database integration
    currentUser
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}