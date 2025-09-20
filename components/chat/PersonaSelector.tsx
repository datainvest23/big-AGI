'use client'

import { useSettingsStore } from '@/lib/stores/settings-store'
import { useChatStore } from '@/lib/stores/chat-store'
import { X, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface PersonaSelectorProps {
  open: boolean
  onClose: () => void
  conversationId: string
}

export function PersonaSelector({ open, onClose, conversationId }: PersonaSelectorProps) {
  const { personas } = useSettingsStore()
  const { conversations, setActiveConversation } = useChatStore()

  const conversation = conversations.find(c => c.id === conversationId)
  
  const handleSelectPersona = (personaId: string) => {
    if (conversation) {
      // Update conversation persona
      const updated = {
        ...conversation,
        persona: personaId as any,
        updatedAt: new Date(),
      }
      
      // Update in store (this is a simplified update, in a real app you'd have a proper action)
      useChatStore.setState(state => ({
        conversations: state.conversations.map(c => 
          c.id === conversationId ? updated : c
        )
      }))
      
      toast.success(`Switched to ${personas.find(p => p.id === personaId)?.title} persona`)
    }
    onClose()
  }

  if (!open || !conversation) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Choose AI Persona</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => handleSelectPersona(persona.id)}
                className={`p-4 border rounded-lg text-left transition-all hover:border-primary hover:bg-primary/5 ${
                  conversation.persona === persona.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {persona.symbol}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{persona.title}</h3>
                      {conversation.persona === persona.id && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {persona.description}
                    </p>
                    
                    {persona.examples.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          Example prompts:
                        </div>
                        <div className="space-y-1">
                          {persona.examples.slice(0, 2).map((example, index) => (
                            <div key={index} className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                              &quot;{example}&quot;
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            AI personas provide specialized system prompts to tailor responses for specific use cases.
            You can switch personas at any time during a conversation.
          </p>
        </div>
      </div>
    </div>
  )
}