'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { ChatStore, Conversation, Message, BeamResult } from '../types'
import { DEFAULT_PERSONAS } from '../constants'

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isTyping: false,
      beamResults: [],

      createConversation: () => {
        const id = uuidv4()
        const newConversation: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          persona: 'generic',
          model: 'gpt-4',
          createdAt: new Date(),
          updatedAt: new Date(),
          tokenCount: 0,
          beamEnabled: false,
        }
        
        set(state => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: id,
        }))
        
        return id
      },

      deleteConversation: (id: string) => {
        set(state => ({
          conversations: state.conversations.filter(c => c.id !== id),
          activeConversationId: state.activeConversationId === id ? 
            (state.conversations.length > 1 ? state.conversations.find(c => c.id !== id)?.id || null : null) :
            state.activeConversationId,
        }))
      },

      setActiveConversation: (id: string) => {
        set({ activeConversationId: id })
      },

      addMessage: (conversationId: string, messageData) => {
        const message: Message = {
          id: uuidv4(),
          timestamp: new Date(),
          ...messageData,
        }

        set(state => ({
          conversations: state.conversations.map(conv => {
            if (conv.id === conversationId) {
              const updatedMessages = [...conv.messages, message]
              return {
                ...conv,
                messages: updatedMessages,
                updatedAt: new Date(),
                title: conv.messages.length === 0 && message.role === 'user' 
                  ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                  : conv.title,
              }
            }
            return conv
          }),
        }))
      },

      updateMessage: (conversationId: string, messageId: string, content: string) => {
        set(state => ({
          conversations: state.conversations.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: conv.messages.map(msg => 
                  msg.id === messageId ? { ...msg, content } : msg
                ),
                updatedAt: new Date(),
              }
            }
            return conv
          }),
        }))
      },

      setTyping: (typing: boolean) => {
        set({ isTyping: typing })
      },

      addBeamResult: (result: BeamResult) => {
        set(state => ({
          beamResults: [result, ...state.beamResults.slice(0, 9)], // Keep last 10 results
        }))
      },
    }),
    {
      name: 'big-agi-chat-store',
      version: 1,
    }
  )
)