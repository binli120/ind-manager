// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface Comment {
  id: string
  position: number
  text: string
  author: string
  timestamp: Date
}

interface CommentPopupProps {
  position: { top: number; left: number }
  comment?: Comment | null
  onSave: (text: string) => void
  onClose: () => void
}

export function CommentPopup({ position, comment, onSave, onClose }: CommentPopupProps) {
  const [commentText, setCommentText] = useState(comment?.text || "")

  useEffect(() => {
    setCommentText(comment?.text || "")
  }, [comment])

  const handleSave = () => {
    if (commentText.trim()) {
      onSave(commentText)
      setCommentText("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <div
      className="fixed z-[99999] bg-card border-2 border-amber-500 rounded-lg shadow-2xl p-4 w-80"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{comment ? "View Comment" : "Add Comment"}</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {comment ? (
        <div>
          <div className="mb-2 pb-2 border-b border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{comment.author}</span>
              <span className="mx-1">•</span>
              {comment.timestamp.toLocaleString()}
            </p>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{comment.text}</p>
        </div>
      ) : (
        <div>
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your comment here..."
            className="mb-3 min-h-[100px] resize-none"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!commentText.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Save Comment
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
