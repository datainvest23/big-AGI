import { Message, ModelId } from '../types'

// Simple token estimation (more accurate would require tiktoken)
export class TokenCounter {
  private static readonly CHARS_PER_TOKEN = 4 // Rough estimate
  private static readonly TOKEN_OVERHEAD = 10 // Overhead per message

  static estimateTokens(text: string): number {
    // Basic estimation: ~4 characters per token
    return Math.ceil(text.length / this.CHARS_PER_TOKEN)
  }

  static estimateMessagesTokens(messages: Message[], model: ModelId): number {
    let totalTokens = 0

    for (const message of messages) {
      // Base token count for message content
      totalTokens += this.estimateTokens(message.content)
      
      // Add overhead for message structure
      totalTokens += this.TOKEN_OVERHEAD
      
      // Add tokens for role
      totalTokens += this.estimateTokens(message.role)
    }

    // Add model-specific overhead
    if (model.startsWith('gpt')) {
      totalTokens += 10 // OpenAI format overhead
    } else if (model.startsWith('claude')) {
      totalTokens += 15 // Anthropic format overhead
    }

    return totalTokens
  }

  static getContextWindow(model: ModelId): number {
    const contextWindows: Record<string, number> = {
      'gpt-4': 8192,
      'gpt-3.5-turbo': 4096,
      'claude-3-opus': 200000,
      'claude-3-sonnet': 200000,
      'claude-3-haiku': 200000,
    }

    return contextWindows[model] || 4096
  }

  static getRemainingTokens(
    messages: Message[], 
    model: ModelId, 
    maxResponseTokens: number = 2048
  ): number {
    const contextWindow = this.getContextWindow(model)
    const usedTokens = this.estimateMessagesTokens(messages, model)
    return contextWindow - usedTokens - maxResponseTokens
  }

  static truncateMessages(
    messages: Message[], 
    model: ModelId, 
    maxResponseTokens: number = 2048
  ): Message[] {
    const contextWindow = this.getContextWindow(model)
    const maxInputTokens = contextWindow - maxResponseTokens
    
    // Always keep system message if present
    const systemMessage = messages.find(m => m.role === 'system')
    const otherMessages = messages.filter(m => m.role !== 'system')
    
    let currentTokens = systemMessage ? this.estimateMessagesTokens([systemMessage], model) : 0
    const truncatedMessages: Message[] = systemMessage ? [systemMessage] : []
    
    // Add messages from most recent, working backwards
    for (let i = otherMessages.length - 1; i >= 0; i--) {
      const message = otherMessages[i]
      const messageTokens = this.estimateMessagesTokens([message], model)
      
      if (currentTokens + messageTokens <= maxInputTokens) {
        truncatedMessages.splice(systemMessage ? 1 : 0, 0, message)
        currentTokens += messageTokens
      } else {
        // Try to truncate the message content if it's a user message
        if (message.role === 'user') {
          const availableTokens = maxInputTokens - currentTokens - this.TOKEN_OVERHEAD
          if (availableTokens > 100) { // Only if we have reasonable space
            const maxChars = (availableTokens - 10) * this.CHARS_PER_TOKEN
            const truncatedContent = message.content.slice(0, maxChars) + '...[truncated]'
            const truncatedMessage: Message = {
              ...message,
              content: truncatedContent,
            }
            truncatedMessages.splice(systemMessage ? 1 : 0, 0, truncatedMessage)
          }
        }
        break
      }
    }
    
    return truncatedMessages
  }

  static formatTokenCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  static getTokenCostEstimate(model: ModelId, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
    }

    const modelPricing = pricing[model]
    if (!modelPricing) return 0

    return (inputTokens / 1000) * modelPricing.input + (outputTokens / 1000) * modelPricing.output
  }
}