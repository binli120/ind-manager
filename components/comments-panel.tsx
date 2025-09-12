"use client"

import { useAppSelector, useAppDispatch } from "@/lib/store"
import { setCommentsPanelOpen } from "@/lib/store/slices/uiSlice"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, CheckCircle, X } from "lucide-react"

export function CommentsPanel() {
  const dispatch = useAppDispatch()
  const { commentsPanelOpen } = useAppSelector((state) => state.ui)
  const { currentDocument } = useAppSelector((state) => state.documents)

  // Get comments for current document (placeholder for now)
  const openComments = currentDocument?.comments?.filter((comment) => !comment.resolved) || []
  const resolvedComments = currentDocument?.comments?.filter((comment) => comment.resolved) || []

  const handleClose = () => {
    dispatch(setCommentsPanelOpen(false))
  }

  if (!commentsPanelOpen) {
    return null
  }

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-card-foreground">Comments</h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Tabs defaultValue="open" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open" className="text-xs">
              Open ({openComments.length})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs">
              Resolved ({resolvedComments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-4">
            {openComments.length > 0 ? (
              <div className="space-y-3">
                {openComments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-accent/5 rounded-lg border border-border">
                    <p className="text-sm text-card-foreground">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {comment.authorName} • {comment.createdAt}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">No comment threads could be found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="mt-4">
            {resolvedComments.length > 0 ? (
              <div className="space-y-3">
                {resolvedComments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-accent/5 rounded-lg border border-border opacity-60">
                    <p className="text-sm text-card-foreground">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {comment.authorName} • {comment.createdAt}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">No resolved comments</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
