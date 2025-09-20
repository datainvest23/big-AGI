'use client'

import { useState, useEffect } from 'react'
import { useChatStore } from '@/lib/stores/chat-store'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { ChatSidebar } from './ChatSidebar'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { BeamMode } from './BeamMode'
import { SettingsModal } from './SettingsModal'
import { PersonaSelector } from './PersonaSelector'
import { Menu, Settings, Zap, ZapOff } from 'lucide-react'
import toast from 'react-hot-toast'

export function ChatInterface() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [personaOpen, setPersonaOpen] = useState(false)

  const { 
    conversations, 
    activeConversationId, 
    createConversation, 
    setActiveConversation,
    isTyping 
  } = useChatStore()

  const { 
    uiState, 
    toggleSidebar, 
    toggleBeamMode,
    apiKeys 
  } = useSettingsStore()

  const activeConversation = conversations.find(c => c.id === activeConversationId)

  // Create initial conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      createConversation()
    } else if (!activeConversationId && conversations.length > 0) {
      setActiveConversation(conversations[0].id)
    }
  }, [conversations.length, activeConversationId, createConversation, setActiveConversation])

  // Check API keys
  useEffect(() => {
    const hasKeys = apiKeys.openai || apiKeys.anthropic || apiKeys.openrouter
    if (!hasKeys && !settingsOpen) {
      toast.error('Please configure your API keys in settings')
      setSettingsOpen(true)
    }
  }, [apiKeys, settingsOpen])

  const handleNewChat = () => {
    const id = createConversation()
    setActiveConversation(id)
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className={`${uiState.sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r border-border overflow-hidden`}>
        <ChatSidebar onNewChat={handleNewChat} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {activeConversation && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPersonaOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="text-lg">
                    {useSettingsStore.getState().personas.find(p => p.id === activeConversation.persona)?.symbol}
                  </span>
                  <span className="text-sm font-medium">
                    {useSettingsStore.getState().personas.find(p => p.id === activeConversation.persona)?.title}
                  </span>
                </button>
                
                <div className="w-px h-6 bg-border" />
                
                <div className="text-sm text-muted-foreground">
                  {activeConversation.messages.length} messages
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Beam Toggle */}
            <button
              onClick={toggleBeamMode}
              className={`p-2 rounded-lg transition-colors ${
                uiState.beamMode 
                  ? 'bg-primary text-primary-foreground beam-pulse' 
                  : 'hover:bg-muted'
              }`}
              title={uiState.beamMode ? 'Disable Beam Mode' : 'Enable Beam Mode'}
            >
              {uiState.beamMode ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
            </button>

            {/* Settings */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Beam Mode Indicator */}
        {uiState.beamMode && <BeamMode />}

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          {activeConversation ? (
            <ChatMessages conversation={activeConversation} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-xl font-semibold mb-2">Welcome to Big-AGI Lightweight</h2>
                <p className="text-sm">Start a new conversation to begin</p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        {activeConversation && (
          <div className="border-t border-border bg-background/50 backdrop-blur-sm">
            <ChatInput 
              conversationId={activeConversation.id}
              disabled={isTyping}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
      {activeConversation && (
        <PersonaSelector 
          open={personaOpen} 
          onClose={() => setPersonaOpen(false)}
          conversationId={activeConversation.id}
        />
      )}
    </div>
  )
}