'use client'

import { useEffect, useRef } from 'react'
import { Conversation, Message } from '@/lib/types'
import { MessageComponent } from './MessageComponent'

interface ChatMessagesProps {
  conversation: Conversation
}

export function ChatMessages({ conversation }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation.messages])

  if (conversation.messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">💭</div>
          <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
          <p className="text-muted-foreground text-sm">
            Ask a question, upload files, or try one of the example prompts below.
          </p>
          
          {/* Example prompts based on persona */}
          <div className="mt-6 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Try asking:
            </p>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
                "Explain quantum computing in simple terms"
              </div>
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
                "Help me debug this code"
              </div>
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
                "Create a marketing strategy"
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        {conversation.messages.map((message, index) => (
          <MessageComponent
            key={message.id}
            message={message}
            isLast={index === conversation.messages.length - 1}
            conversationId={conversation.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}