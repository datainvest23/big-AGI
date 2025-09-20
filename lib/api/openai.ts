import { ModelId, Message } from '../types'

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function callOpenAI(
  messages: Message[],
  model: ModelId,
  apiKey: string,
  options: {
    temperature?: number
    maxTokens?: number
    stream?: boolean
  } = {}
): Promise<ReadableStream | OpenAIResponse> {
  const { temperature = 0.7, maxTokens = 2048, stream = false } = options

  const openaiMessages: OpenAIMessage[] = messages.map(msg => ({
    role: msg.role as 'system' | 'user' | 'assistant',
    content: msg.content,
  }))

  const requestBody = {
    model,
    messages: openaiMessages,
    temperature,
    max_tokens: maxTokens,
    stream,
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
  }

  if (stream) {
    return response.body!
  }

  return response.json()
}

export async function* parseOpenAIStream(stream: ReadableStream): AsyncGenerator<string, void, unknown> {
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
            const content = parsed.choices?.[0]?.delta?.content || ''
            if (content) {
              yield content
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