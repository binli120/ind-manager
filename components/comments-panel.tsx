"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, CheckCircle, X } from "lucide-react"

export function CommentsPanel() {
  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-card-foreground">Comments</h3>
          <Button variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Tabs defaultValue="open" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open" className="text-xs">
              Open
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs">
              Resolved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-4">
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted">No comment threads could be found</p>
            </div>
          </TabsContent>

          <TabsContent value="resolved" className="mt-4">
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted">No resolved comments</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
