'use client'

import { useState } from 'react'
import { useChatStore } from '@/lib/stores/chat-store'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { Plus, MessageSquare, Trash2, MoreVertical } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ChatSidebarProps {
  onNewChat: () => void
}

export function ChatSidebar({ onNewChat }: ChatSidebarProps) {
  const [hoveredChat, setHoveredChat] = useState<string | null>(null)
  const { conversations, activeConversationId, setActiveConversation, deleteConversation } = useChatStore()
  const { personas } = useSettingsStore()

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(chatId)
    }
  }

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conversation) => {
              const persona = personas.find(p => p.id === conversation.persona)
              const isActive = conversation.id === activeConversationId
              
              return (
                <div
                  key={conversation.id}
                  className={`group relative mb-1 p-3 rounded-lg cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-muted border border-border' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setActiveConversation(conversation.id)}
                  onMouseEnter={() => setHoveredChat(conversation.id)}
                  onMouseLeave={() => setHoveredChat(null)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg flex-shrink-0 mt-0.5">
                      {persona?.symbol || '🤖'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">
                          {conversation.title}
                        </h3>
                        {conversation.beamEnabled && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" title="Beam enabled" />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{conversation.messages.length} messages</span>
                        <span>{formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}</span>
                      </div>
                      
                      {conversation.messages.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {conversation.messages[conversation.messages.length - 1].content.slice(0, 80)}...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  {(hoveredChat === conversation.id || isActive) && (
                    <button
                      onClick={(e) => handleDeleteChat(e, conversation.id)}
                      className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          Big-AGI Lightweight v1.0
        </div>
      </div>
    </div>
  )
}