'use client'

import { useState, useRef, useCallback } from 'react'
import { useChatStore } from '@/lib/stores/chat-store'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { FileProcessor } from '@/lib/utils/file-processor'
import { TokenCounter } from '@/lib/utils/token-counter'
import { BeamProcessor } from '@/lib/api/beam'
import { callOpenAI, parseOpenAIStream } from '@/lib/api/openai'
import { callAnthropic, parseAnthropicStream } from '@/lib/api/anthropic'
import { Send, Paperclip, X, FileText, Image, File, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { FileAttachment, Message } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

interface ChatInputProps {
  conversationId: string
  disabled?: boolean
}

export function ChatInput({ conversationId, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { conversations, addMessage, setTyping, addBeamResult } = useChatStore()
  const { apiKeys, chatSettings, uiState, personas } = useSettingsStore()

  const conversation = conversations.find(c => c.id === conversationId)
  if (!conversation) return null

  const persona = personas.find(p => p.id === conversation.persona)
  const remainingTokens = TokenCounter.getRemainingTokens(
    conversation.messages, 
    conversation.model, 
    chatSettings.maxTokens
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() && attachments.length === 0) return
    if (disabled) return

    const content = [
      ...attachments.map(att => att.content),
      input.trim()
    ].filter(Boolean).join('\n\n')

    // Add user message
    const userMessage: Omit<Message, 'id' | 'timestamp'> = {
      role: 'user',
      content,
    }
    addMessage(conversationId, userMessage)

    // Clear input
    setInput('')
    setAttachments([])
    setTyping(true)

    try {
      // Prepare messages for API
      const messages: Message[] = [
        ...(persona?.systemMessage ? [{
          id: uuidv4(),
          role: 'system' as const,
          content: persona.systemMessage,
          timestamp: new Date(),
        }] : []),
        ...conversation.messages,
        {
          id: uuidv4(),
          role: 'user' as const,
          content,
          timestamp: new Date(),
        }
      ]

      if (uiState.beamMode && uiState.selectedModels.length > 1) {
        // Beam mode - multiple models
        await handleBeamResponse(messages)
      } else {
        // Single model mode
        await handleSingleResponse(messages, conversation.model)
      }
    } catch (error) {
      console.error('Error generating response:', error)
      toast.error('Failed to generate response')
      addMessage(conversationId, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setTyping(false)
    }
  }

  const handleBeamResponse = async (messages: Message[]) => {
    const beamProcessor = new BeamProcessor(apiKeys)
    
    try {
      const beamResult = await beamProcessor.processBeam(
        messages,
        uiState.selectedModels,
        {
          temperature: chatSettings.temperature,
          maxTokens: chatSettings.maxTokens,
        }
      )

      // Add beam result to store
      addBeamResult(beamResult)

      // Add the merged response as assistant message
      addMessage(conversationId, {
        role: 'assistant',
        content: beamResult.mergedContent,
        beamId: beamResult.id,
        tokens: beamResult.totalTokens,
      })

      toast.success(`Beam complete! ${beamResult.responses.length} models responded`)
    } catch (error) {
      throw new Error(`Beam processing failed: ${error}`)
    }
  }

  const handleSingleResponse = async (messages: Message[], modelId: string) => {
    try {
      let stream: ReadableStream
      let parseStream: (stream: ReadableStream) => AsyncGenerator<string, void, unknown>

      if (modelId.startsWith('gpt')) {
        stream = await callOpenAI(messages, modelId as any, apiKeys.openai, {
          temperature: chatSettings.temperature,
          maxTokens: chatSettings.maxTokens,
          stream: true,
        }) as ReadableStream
        parseStream = parseOpenAIStream
      } else if (modelId.startsWith('claude')) {
        stream = await callAnthropic(messages, modelId as any, apiKeys.anthropic, {
          temperature: chatSettings.temperature,
          maxTokens: chatSettings.maxTokens,
          stream: true,
        }) as ReadableStream
        parseStream = parseAnthropicStream
      } else {
        throw new Error(`Unsupported model: ${modelId}`)
      }

      // Add empty assistant message to start streaming
      const assistantMessageId = uuidv4()
      addMessage(conversationId, {
        role: 'assistant',
        content: '',
        model: modelId,
      })

      // Stream the response
      let fullContent = ''
      for await (const chunk of parseStream(stream)) {
        fullContent += chunk
        // Update the message content (in a real app, you'd want a more efficient update mechanism)
        const updatedConversation = useChatStore.getState().conversations.find(c => c.id === conversationId)
        if (updatedConversation) {
          const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1]
          if (lastMessage.role === 'assistant') {
            useChatStore.getState().updateMessage?.(conversationId, lastMessage.id, fullContent)
          }
        }
      }
    } catch (error) {
      throw new Error(`API call failed: ${error}`)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    try {
      const processed = await FileProcessor.processFiles(files)
      setAttachments(prev => [...prev, ...processed])
      toast.success(`${processed.length} file(s) attached`)
    } catch (error) {
      toast.error('Failed to process files')
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      try {
        const processed = await FileProcessor.processFiles(files)
        setAttachments(prev => [...prev, ...processed])
        toast.success(`${processed.length} file(s) attached`)
      } catch (error) {
        toast.error('Failed to process files')
      }
    }
  }, [])

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />
    if (type === 'application/pdf') return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  return (
    <div className="p-4">
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
            >
              {getFileIcon(attachment.type)}
              <span className="truncate max-w-[200px]">{attachment.name}</span>
              <button
                onClick={() => handleRemoveAttachment(attachment.id)}
                className="p-0.5 hover:bg-muted-foreground/20 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative border border-border rounded-lg bg-background transition-colors ${
            isDragging ? 'border-primary border-2' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={uiState.beamMode ? "Ask multiple AI models..." : "Type your message..."}
            className="w-full min-h-[120px] max-h-[300px] p-4 pr-20 bg-transparent resize-none focus:outline-none"
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />

          {/* Token Counter */}
          {remainingTokens < 1000 && (
            <div className="absolute top-2 right-2 text-xs text-destructive">
              {remainingTokens} tokens remaining
            </div>
          )}

          {/* Actions */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".txt,.md,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.xml,.yaml,.yml,.pdf,.png,.jpg,.jpeg,.gif,.webp,.svg"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={disabled || (!input.trim() && attachments.length === 0)}
              className={`p-2 rounded-lg transition-colors ${
                uiState.beamMode
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {uiState.beamMode ? <Zap className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Paperclip className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-primary font-medium">Drop files here</p>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}