import { Message, ModelId, BeamResponse, BeamResult } from '../types'
import { callOpenAI, parseOpenAIStream, OpenAIResponse } from './openai'
import { callAnthropic, parseAnthropicStream, AnthropicResponse } from './anthropic'
import { v4 as uuidv4 } from 'uuid'

interface BeamOptions {
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export class BeamProcessor {
  private apiKeys: {
    openai: string
    anthropic: string
    openrouter: string
  }

  constructor(apiKeys: { openai: string; anthropic: string; openrouter: string }) {
    this.apiKeys = apiKeys
  }

  async processBeam(
    messages: Message[],
    models: ModelId[],
    options: BeamOptions = {}
  ): Promise<BeamResult> {
    const beamId = uuidv4()
    const startTime = Date.now()

    // Process all models concurrently
    const responses = await Promise.allSettled(
      models.map(model => this.callModel(messages, model, options))
    )

    const beamResponses: BeamResponse[] = responses.map((result, index) => {
      const model = models[index]
      const endTime = Date.now()
      const latency = endTime - startTime

      if (result.status === 'fulfilled') {
        return {
          id: uuidv4(),
          model,
          content: result.value.content,
          tokens: result.value.tokens,
          latency,
        }
      } else {
        return {
          id: uuidv4(),
          model,
          content: '',
          tokens: 0,
          latency,
          error: result.reason.message,
        }
      }
    })

    // Merge successful responses
    const successfulResponses = beamResponses.filter(r => !r.error)
    const mergedContent = await this.mergeResponses(successfulResponses, messages)

    const totalTokens = beamResponses.reduce((sum, r) => sum + r.tokens, 0)
    const averageLatency = beamResponses.reduce((sum, r) => sum + r.latency, 0) / beamResponses.length

    return {
      id: beamId,
      responses: beamResponses,
      mergedContent,
      totalTokens,
      averageLatency,
    }
  }

  async processBeamStream(
    messages: Message[],
    models: ModelId[],
    options: BeamOptions = {}
  ): Promise<ReadableStream<string>> {
    const streams = await Promise.all(
      models.map(model => this.callModelStream(messages, model, options))
    )

    return this.mergeStreams(streams)
  }

  private async callModel(
    messages: Message[],
    model: ModelId,
    options: BeamOptions
  ): Promise<{ content: string; tokens: number }> {
    const startTime = Date.now()

    if (model.startsWith('gpt')) {
      const response = await callOpenAI(messages, model, this.apiKeys.openai, {
        ...options,
        stream: false,
      }) as OpenAIResponse

      return {
        content: response.choices[0].message.content,
        tokens: response.usage.total_tokens,
      }
    } else if (model.startsWith('claude')) {
      const response = await callAnthropic(messages, model, this.apiKeys.anthropic, {
        ...options,
        stream: false,
      }) as AnthropicResponse

      return {
        content: response.content[0].text,
        tokens: response.usage.input_tokens + response.usage.output_tokens,
      }
    }

    throw new Error(`Unsupported model: ${model}`)
  }

  private async callModelStream(
    messages: Message[],
    model: ModelId,
    options: BeamOptions
  ): Promise<ReadableStream<string>> {
    if (model.startsWith('gpt')) {
      const stream = await callOpenAI(messages, model, this.apiKeys.openai, {
        ...options,
        stream: true,
      }) as ReadableStream
      
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of parseOpenAIStream(stream)) {
              controller.enqueue(chunk)
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })
    } else if (model.startsWith('claude')) {
      const stream = await callAnthropic(messages, model, this.apiKeys.anthropic, {
        ...options,
        stream: true,
      }) as ReadableStream
      
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of parseAnthropicStream(stream)) {
              controller.enqueue(chunk)
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })
    }

    throw new Error(`Unsupported model: ${model}`)
  }

  private async mergeResponses(responses: BeamResponse[], originalMessages: Message[]): Promise<string> {
    if (responses.length === 0) {
      return 'No successful responses received.'
    }

    if (responses.length === 1) {
      return responses[0].content
    }

    // Create a synthesis prompt
    const synthesisPrompt = `
You are an expert AI response synthesizer. You have received multiple responses to the same query from different AI models. Your task is to create a single, comprehensive response that combines the best insights from all responses while avoiding redundancy.

Original Query Context:
${originalMessages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

Responses to synthesize:
${responses.map((r, i) => `\n--- Response ${i + 1} (${r.model}) ---\n${r.content}`).join('\n')}

Please provide a synthesized response that:
1. Combines the best insights from all responses
2. Removes redundant information
3. Maintains a coherent structure and flow
4. Preserves important details and nuances
5. Is concise yet comprehensive

Synthesized Response:`

    // Use the first available model to synthesize
    try {
      const firstModel = responses[0].model
      const synthesisMessages: Message[] = [
        {
          id: uuidv4(),
          role: 'user',
          content: synthesisPrompt,
          timestamp: new Date(),
        }
      ]

      const result = await this.callModel(synthesisMessages, firstModel, { temperature: 0.3 })
      return result.content
    } catch (error) {
      // Fallback: return the longest response
      return responses.reduce((longest, current) => 
        current.content.length > longest.content.length ? current : longest
      ).content
    }
  }

  private mergeStreams(streams: ReadableStream<string>[]): ReadableStream<string> {
    return new ReadableStream({
      async start(controller) {
        try {
          const readers = streams.map(stream => stream.getReader())
          const activeReaders = new Set(readers)
          const buffers = new Map<ReadableStreamDefaultReader<string>, string>()

          // Initialize buffers
          readers.forEach(reader => buffers.set(reader, ''))

          while (activeReaders.size > 0) {
            const promises = Array.from(activeReaders).map(async reader => {
              const result = await reader.read()
              return { reader, result }
            })

            const { reader, result } = await Promise.race(promises)

            if (result.done) {
              activeReaders.delete(reader)
              reader.releaseLock()
            } else {
              const buffer = buffers.get(reader) + result.value
              buffers.set(reader, buffer)

              // Emit chunks as they come
              controller.enqueue(result.value)
            }
          }

          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })
  }
}