import { Persona, Model } from './types'

export const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'developer',
    title: 'Developer',
    description: 'Expert programming assistant',
    systemMessage: 'You are a sophisticated, accurate, and modern AI programming assistant. You help with coding, debugging, architecture, and best practices.',
    symbol: '👩‍💻',
    examples: [
      'Debug this React component',
      'Optimize this algorithm',
      'Create a REST API',
      'Review my code',
    ],
  },
  {
    id: 'scientist',
    title: 'Scientist',
    description: 'Research and analysis expert',
    systemMessage: 'You are a scientific research assistant. You help with research, data analysis, hypothesis formation, and scientific writing with evidence-based reasoning.',
    symbol: '🔬',
    examples: [
      'Analyze this dataset',
      'Explain quantum mechanics',
      'Design an experiment',
      'Review research papers',
    ],
  },
  {
    id: 'catalyst',
    title: 'Catalyst',
    description: 'Creative problem solver and growth hacker',
    systemMessage: 'You are a creative catalyst focused on innovation, growth hacking, marketing, and creative problem-solving. You think outside the box and provide actionable insights.',
    symbol: '🚀',
    examples: [
      'Growth strategy ideas',
      'Creative marketing campaign',
      'Product innovation',
      'Brainstorm solutions',
    ],
  },
  {
    id: 'executive',
    title: 'Executive',
    description: 'Business strategy and leadership',
    systemMessage: 'You are an executive consultant focused on business strategy, leadership, decision-making, and organizational excellence. You provide strategic insights and practical solutions.',
    symbol: '👔',
    examples: [
      'Strategic planning',
      'Team leadership advice',
      'Business analysis',
      'Decision frameworks',
    ],
  },
  {
    id: 'designer',
    title: 'Designer',
    description: 'Creative design and user experience',
    systemMessage: 'You are a design expert specializing in user experience, visual design, and creative solutions. You think about usability, aesthetics, and user-centered design.',
    symbol: '🎨',
    examples: [
      'UI/UX improvements',
      'Design systems',
      'Visual hierarchy',
      'User research insights',
    ],
  },
  {
    id: 'generic',
    title: 'Assistant',
    description: 'General purpose AI assistant',
    systemMessage: 'You are a helpful, knowledgeable, and friendly AI assistant. You provide accurate information and thoughtful responses across a wide range of topics.',
    symbol: '🤖',
    examples: [
      'General questions',
      'Writing assistance',
      'Information lookup',
      'Problem solving',
    ],
  },
]

export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    contextWindow: 8192,
    costPer1kTokens: 0.03,
    supportsImages: true,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    contextWindow: 4096,
    costPer1kTokens: 0.002,
    supportsImages: false,
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    contextWindow: 200000,
    costPer1kTokens: 0.015,
    supportsImages: true,
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    costPer1kTokens: 0.003,
    supportsImages: true,
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    costPer1kTokens: 0.00025,
    supportsImages: true,
  },
]

export const DEFAULT_CHAT_SETTINGS = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
}

export const SUPPORTED_FILE_TYPES = {
  text: ['.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml', '.yaml', '.yml'],
  pdf: ['.pdf'],
  image: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
} as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_TOKEN_LIMIT = 8000
export const BEAM_DEFAULT_MODELS: Model['id'][] = ['gpt-4', 'claude-3-sonnet']