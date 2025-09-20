'use client'

import { useState } from 'react'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { X, Key, Sliders, Zap, Palette } from 'lucide-react'
import toast from 'react-hot-toast'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'api' | 'chat' | 'beam' | 'ui'>('api')
  
  const { 
    apiKeys, 
    chatSettings, 
    uiState, 
    models,
    setApiKey, 
    updateChatSettings, 
    setSelectedModels,
    toggleTheme 
  } = useSettingsStore()

  const handleSave = () => {
    toast.success('Settings saved')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-48 border-r border-border p-4">
            <nav className="space-y-2">
              {[
                { id: 'api', label: 'API Keys', icon: Key },
                { id: 'chat', label: 'Chat Settings', icon: Sliders },
                { id: 'beam', label: 'Beam Mode', icon: Zap },
                { id: 'ui', label: 'Interface', icon: Palette },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">API Keys</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Configure your API keys to enable AI model access.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      OpenAI API Key
                    </label>
                    <input
                      type="password"
                      value={apiKeys.openai}
                      onChange={(e) => setApiKey('openai', e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Required for GPT-4 and GPT-3.5 Turbo
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Anthropic API Key
                    </label>
                    <input
                      type="password"
                      value={apiKeys.anthropic}
                      onChange={(e) => setApiKey('anthropic', e.target.value)}
                      placeholder="sk-ant-..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Required for Claude models
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      OpenRouter API Key
                    </label>
                    <input
                      type="password"
                      value={apiKeys.openrouter}
                      onChange={(e) => setApiKey('openrouter', e.target.value)}
                      placeholder="sk-or-..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Access to multiple models through OpenRouter
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Chat Settings</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Adjust AI model behavior and response settings.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Temperature: {chatSettings.temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={chatSettings.temperature}
                      onChange={(e) => updateChatSettings({ temperature: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Higher values make responses more creative, lower values more focused
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Response Tokens
                    </label>
                    <input
                      type="number"
                      min="256"
                      max="4096"
                      step="256"
                      value={chatSettings.maxTokens}
                      onChange={(e) => updateChatSettings({ maxTokens: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum length of AI responses
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Top P: {chatSettings.topP}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={chatSettings.topP}
                      onChange={(e) => updateChatSettings({ topP: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Controls response diversity
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'beam' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Beam Mode</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Configure multi-model AI reasoning for enhanced responses.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Selected Models for Beam</h4>
                    <div className="space-y-2">
                      {models.map(model => (
                        <label key={model.id} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={uiState.selectedModels.includes(model.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedModels([...uiState.selectedModels, model.id])
                              } else {
                                setSelectedModels(uiState.selectedModels.filter(id => id !== model.id))
                              }
                            }}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {model.provider} • {model.contextWindow.toLocaleString()} tokens • ${model.costPer1kTokens}/1K tokens
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Select 2+ models for Beam mode. Responses will be merged for better quality.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ui' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Interface</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Customize the appearance and behavior of the interface.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Theme</div>
                      <div className="text-sm text-muted-foreground">
                        Current: {uiState.theme}
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Toggle Theme
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}