'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SettingsStore, ApiKeys, ChatSettings, UIState } from '../types'
import { DEFAULT_PERSONAS, AVAILABLE_MODELS, DEFAULT_CHAT_SETTINGS } from '../constants'

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      apiKeys: {
        openai: '',
        anthropic: '',
        openrouter: '',
      },
      
      chatSettings: DEFAULT_CHAT_SETTINGS,
      
      personas: DEFAULT_PERSONAS,
      
      models: AVAILABLE_MODELS,
      
      uiState: {
        sidebarOpen: true,
        theme: 'light',
        beamMode: false,
        selectedModels: ['gpt-4', 'claude-3-sonnet'],
      },

      setApiKey: (provider: keyof ApiKeys, key: string) => {
        set(state => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: key,
          },
        }))
      },

      updateChatSettings: (settings: Partial<ChatSettings>) => {
        set(state => ({
          chatSettings: {
            ...state.chatSettings,
            ...settings,
          },
        }))
      },

      toggleBeamMode: () => {
        set(state => ({
          uiState: {
            ...state.uiState,
            beamMode: !state.uiState.beamMode,
          },
        }))
      },

      toggleSidebar: () => {
        set(state => ({
          uiState: {
            ...state.uiState,
            sidebarOpen: !state.uiState.sidebarOpen,
          },
        }))
      },

      toggleTheme: () => {
        set(state => ({
          uiState: {
            ...state.uiState,
            theme: state.uiState.theme === 'light' ? 'dark' : 'light',
          },
        }))
      },

      setSelectedModels: (models) => {
        set(state => ({
          uiState: {
            ...state.uiState,
            selectedModels: models,
          },
        }))
      },
    }),
    {
      name: 'big-agi-settings-store',
      version: 1,
    }
  )
)