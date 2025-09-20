'use client'

import { useSettingsStore } from '@/lib/stores/settings-store'
import { Zap, Check } from 'lucide-react'

export function BeamMode() {
  const { uiState, models } = useSettingsStore()
  const selectedModels = models.filter(m => uiState.selectedModels.includes(m.id))

  return (
    <div className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Zap className="w-4 h-4 text-blue-500" />
          <span>Beam Mode Active</span>
        </div>
        
        <div className="w-px h-4 bg-border" />
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Models:</span>
          {selectedModels.map((model, index) => (
            <div key={model.id} className="flex items-center gap-1">
              <div className="flex items-center gap-1 px-2 py-1 bg-background/50 rounded text-xs">
                <Check className="w-3 h-3 text-green-500" />
                <span>{model.name}</span>
              </div>
              {index < selectedModels.length - 1 && (
                <span className="text-muted-foreground">+</span>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex-1" />
        
        <div className="text-xs text-muted-foreground">
          Multi-model reasoning enabled
        </div>
      </div>
    </div>
  )
}