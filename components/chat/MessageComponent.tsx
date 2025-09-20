'use client'

import { useState } from 'react'
import { Message } from '@/lib/types'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { useChatStore } from '@/lib/stores/chat-store'
import { Copy, Check, User, Bot, Zap, Edit3, Save, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface MessageComponentProps {
  message: Message
  isLast: boolean
  conversationId: string
}

export function MessageComponent({ message, isLast, conversationId }: MessageComponentProps) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  
  const { uiState } = useSettingsStore()
  const { updateMessage } = useChatStore()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content) {
      updateMessage(conversationId, message.id, editContent.trim())
      toast.success('Message updated')
    }
    setEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(message.content)
    setEditing(false)
  }

  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const isBeam = !!message.beamId

  return (
    <div className={`group relative ${isUser ? 'ml-12' : 'mr-12'}`}>
      <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : isBeam
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
            : 'bg-muted text-muted-foreground'
        }`}>
          {isUser ? (
            <User className="w-4 h-4" />
          ) : isBeam ? (
            <Zap className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`rounded-lg p-4 ${
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : isSystem
              ? 'bg-muted/50 border border-border'
              : 'bg-muted'
          }`}>
            {editing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[100px] bg-background text-foreground border border-border rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors text-sm"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {isUser ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        const language = match ? match[1] : ''
                        const inline = !language
                        
                        if (!inline && language) {
                          return (
                            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                              <code className={`language-${language}`}>
                                {String(children).replace(/\n$/, '')}
                              </code>
                            </pre>
                          )
                        }
                        
                        return (
                          <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                            {children}
                          </code>
                        )
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
            )}
          </div>

          {/* Message Footer */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {message.model && (
                <>
                  <span>{message.model}</span>
                  <span>•</span>
                </>
              )}
              <span>{formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
              {message.tokens && (
                <>
                  <span>•</span>
                  <span>{message.tokens} tokens</span>
                </>
              )}
              {isBeam && (
                <>
                  <span>•</span>
                  <span className="text-blue-500">Beam</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isUser && (
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 hover:bg-muted rounded-md transition-colors"
                  title="Edit message"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
              
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                title="Copy message"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}