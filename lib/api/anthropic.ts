import { ModelId, Message } from '../types'

export interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AnthropicResponse {
  id: string
  type: 'message'
  role: 'assistant'
  content: Array<{
    type: 'text'
    text: string
  }>
  model: string
  stop_reason: string
  stop_sequence: null
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export async function callAnthropic(
  messages: Message[],
  model: ModelId,
  apiKey: string,
  options: {
    temperature?: number
    maxTokens?: number
    stream?: boolean
  } = {}
): Promise<ReadableStream | AnthropicResponse> {
  const { temperature = 0.7, maxTokens = 2048, stream = false } = options

  // Filter out system messages and convert to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const anthropicMessages: AnthropicMessage[] = messages
    .filter(m => m.role !== 'system')
    .map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

  const requestBody = {
    model,
    messages: anthropicMessages,
    max_tokens: maxTokens,
    temperature,
    stream,
    ...(systemMessage && { system: systemMessage }),
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`)
  }

  if (stream) {
    return response.body!
  }

  return response.json()
}

export async function* parseAnthropicStream(stream: ReadableStream): AsyncGenerator<string, void, unknown> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta') {
              const content = parsed.delta?.text || ''
              if (content) {
                yield content
              }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}