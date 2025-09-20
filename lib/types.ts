// Core Types for Big-AGI Lightweight

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model?: string
  beamId?: string // For beam responses
  tokens?: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  persona: PersonaId
  model: ModelId
  createdAt: Date
  updatedAt: Date
  tokenCount: number
  beamEnabled: boolean
}

export type PersonaId = 'developer' | 'scientist' | 'catalyst' | 'executive' | 'designer' | 'generic' | 'custom'

export interface Persona {
  id: PersonaId
  title: string
  description: string
  systemMessage: string
  symbol: string
  examples: string[]
}

export type ModelId = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku'

export interface Model {
  id: ModelId
  name: string
  provider: 'openai' | 'anthropic' | 'openrouter'
  contextWindow: number
  costPer1kTokens: number
  supportsImages: boolean
}

export interface BeamResponse {
  id: string
  model: ModelId
  content: string
  tokens: number
  latency: number
  error?: string
}

export interface BeamResult {
  id: string
  responses: BeamResponse[]
  mergedContent: string
  totalTokens: number
  averageLatency: number
}

export interface FileAttachment {
  id: string
  name: string
  type: string
  size: number
  content: string
  extractedText?: string
  url?: string
}

export interface ChatSettings {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
}

export interface ApiKeys {
  openai: string
  anthropic: string
  openrouter: string
}

// UI State Types
export interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  beamMode: boolean
  selectedModels: ModelId[]
}

// Store Types
export interface ChatStore {
  conversations: Conversation[]
  activeConversationId: string | null
  isTyping: boolean
  beamResults: BeamResult[]
  
  // Actions
  createConversation: () => string
  deleteConversation: (id: string) => void
  setActiveConversation: (id: string) => void
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void
  updateMessage: (conversationId: string, messageId: string, content: string) => void
  setTyping: (typing: boolean) => void
  addBeamResult: (result: BeamResult) => void
}

export interface SettingsStore {
  apiKeys: ApiKeys
  chatSettings: ChatSettings
  personas: Persona[]
  models: Model[]
  uiState: UIState
  
  // Actions
  setApiKey: (provider: keyof ApiKeys, key: string) => void
  updateChatSettings: (settings: Partial<ChatSettings>) => void
  toggleBeamMode: () => void
  toggleSidebar: () => void
  toggleTheme: () => void
  setSelectedModels: (models: ModelId[]) => void
}