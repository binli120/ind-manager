"use client"

// Author: Bin Lee (blee@filynai.com)
// Description: Hosts the floating tool window container used for assistant-driven panels.

import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { X } from "lucide-react"
import { Textarea } from "../ui/textarea"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

interface ToolWindowProps {
  tool: string | null
  onClose: () => void
}

export function ToolWindow({ tool, onClose }: ToolWindowProps) {
  if (!tool) return null

  const renderToolContent = () => {
    switch (tool) {
      case "bold":
      case "italic":
      case "underline":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-input">Text to format</Label>
              <Textarea id="text-input" placeholder="Enter text to apply formatting..." className="mt-2" />
            </div>
            <Button className="w-full">Apply {tool.charAt(0).toUpperCase() + tool.slice(1)}</Button>
          </div>
        )

      case "align-left":
      case "align-center":
      case "align-right":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select text in your document and click apply to align it {tool.replace("align-", "")}.
            </p>
            <Button className="w-full">Apply {tool.replace("align-", "").replace("-", " ")} Alignment</Button>
          </div>
        )

      case "list":
      case "list-ordered":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="list-items">List items (one per line)</Label>
              <Textarea id="list-items" placeholder="Item 1&#10;Item 2&#10;Item 3" className="mt-2" rows={5} />
            </div>
            <Button className="w-full">Create {tool === "list" ? "Bullet" : "Numbered"} List</Button>
          </div>
        )

      case "quote":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="quote-text">Quote text</Label>
              <Textarea id="quote-text" placeholder="Enter quote text..." className="mt-2" />
            </div>
            <div>
              <Label htmlFor="quote-author">Author (optional)</Label>
              <Input id="quote-author" placeholder="Author name" className="mt-2" />
            </div>
            <Button className="w-full">Insert Quote</Button>
          </div>
        )

      case "code":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="code-language">Language</Label>
              <Input id="code-language" placeholder="javascript, python, etc." className="mt-2" />
            </div>
            <div>
              <Label htmlFor="code-content">Code</Label>
              <Textarea id="code-content" placeholder="Enter your code..." className="mt-2" rows={6} />
            </div>
            <Button className="w-full">Insert Code Block</Button>
          </div>
        )

      case "link":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-text">Link text</Label>
              <Input id="link-text" placeholder="Click here" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input id="link-url" placeholder="https://example.com" className="mt-2" />
            </div>
            <Button className="w-full">Insert Link</Button>
          </div>
        )

      case "rewrite":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="rewrite-text">Text to rewrite</Label>
              <Textarea id="rewrite-text" placeholder="Enter text to rewrite..." className="mt-2" rows={4} />
            </div>
            <div>
              <Label htmlFor="rewrite-style">Style</Label>
              <select id="rewrite-style" className="w-full mt-2 p-2 border rounded">
                <option>Professional</option>
                <option>Casual</option>
                <option>Academic</option>
                <option>Creative</option>
              </select>
            </div>
            <Button className="w-full">Rewrite with AI</Button>
          </div>
        )

      case "grammar":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="grammar-text">Text to check</Label>
              <Textarea id="grammar-text" placeholder="Enter text to check grammar..." className="mt-2" rows={5} />
            </div>
            <Button className="w-full">Check Grammar</Button>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Grammar suggestions will appear here...</p>
            </div>
          </div>
        )

      case "outline":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="outline-topic">Topic or content</Label>
              <Textarea
                id="outline-topic"
                placeholder="Enter your topic or paste content to outline..."
                className="mt-2"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="outline-type">Outline type</Label>
              <select id="outline-type" className="w-full mt-2 p-2 border rounded">
                <option>Hierarchical</option>
                <option>Bullet Points</option>
                <option>Numbered</option>
                <option>Mind Map</option>
              </select>
            </div>
            <Button className="w-full">Generate Outline</Button>
          </div>
        )

      case "suggest":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="suggest-context">Context</Label>
              <Textarea
                id="suggest-context"
                placeholder="Describe what you're writing about..."
                className="mt-2"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="suggest-type">Suggestion type</Label>
              <select id="suggest-type" className="w-full mt-2 p-2 border rounded">
                <option>Content Ideas</option>
                <option>Improvements</option>
                <option>Structure</option>
                <option>Tone Adjustments</option>
              </select>
            </div>
            <Button className="w-full">Get AI Suggestions</Button>
          </div>
        )

      case "ai-assistant":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-prompt">What would you like help with?</Label>
              <Textarea id="ai-prompt" placeholder="Ask me anything about your writing..." className="mt-2" rows={4} />
            </div>
            <Button className="w-full">Ask AI Assistant</Button>
            <div className="mt-4 p-3 bg-muted rounded-lg max-h-40 overflow-y-auto">
              <p className="text-sm text-muted-foreground">AI responses will appear here...</p>
            </div>
          </div>
        )

      default:
        return <p>Tool content for {tool}</p>
    }
  }

  const getToolTitle = () => {
    const titles: Record<string, string> = {
      bold: "Bold Text",
      italic: "Italic Text",
      underline: "Underline Text",
      "align-left": "Align Left",
      "align-center": "Align Center",
      "align-right": "Align Right",
      list: "Bullet List",
      "list-ordered": "Numbered List",
      quote: "Insert Quote",
      code: "Code Block",
      link: "Insert Link",
      rewrite: "AI Rewrite",
      grammar: "Grammar Check",
      outline: "Generate Outline",
      suggest: "AI Suggestions",
      "ai-assistant": "AI Assistant",
    }
    return titles[tool] || tool
  }

  return (
    <div className="border-t border-border bg-background">
      <Card className="rounded-none border-0 border-b">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{getToolTitle()}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">{renderToolContent()}</CardContent>
      </Card>
    </div>
  )
}
