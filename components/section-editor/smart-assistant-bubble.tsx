// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"
import { Button } from "@/components/ui/button"
import { Lightbulb, X } from "lucide-react"

interface SmartAssistantBubbleProps {
  position: { top: number; left: number }
  keyword: string
  onClose: () => void
  onOpenMaterials: () => void
}

export function SmartAssistantBubble({ position, keyword, onClose, onOpenMaterials }: SmartAssistantBubbleProps) {
  return (
    <div
      className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ top: position.top, left: position.left }}
    >
      <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg p-3 max-w-xs">
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full bg-white/20 hover:bg-white/30"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>

        <button
          onClick={onOpenMaterials}
          className="flex items-start gap-3 w-full text-left hover:opacity-90 transition-opacity"
        >
          <div className="mt-0.5 p-1.5 rounded-full bg-white/20">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold mb-1">Related Source Contents Found.</p>
            <p className="text-xs opacity-90">
              We found {3} source content related to &quot;<span className="font-medium">{keyword}</span>&quot;. Click
              to view.
            </p>
          </div>
        </button>

        {/* Triangle pointer */}
        <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-gradient-to-br from-purple-600 to-indigo-600 transform rotate-45" />
      </div>
    </div>
  )
}
