// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { useState, useEffect, useRef } from "react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import {
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  Sparkles,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Quote,
  Code,
  Minus,
  FileText,
  FilePenLine,
  TableIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SmartAssistantBubble } from "@/components/section-editor/smart-assistant-bubble"
import { CommentPopup } from "@/components/section-editor/comment-popup"
import { TableInsertDialog } from "@/components/section-editor/table-insert-dialog"
import "./tiptap-editor.css"

interface Comment {
  id: string
  position: number
  text: string
  author: string
  timestamp: Date
}

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  materialsCount?: number
  onOpenMaterials?: () => void
  sectionNumber?: string
}

export function TiptapEditor({
  content,
  onChange,
  materialsCount = 0,
  onOpenMaterials,
  sectionNumber,
}: TiptapEditorProps) {
  const [showBubble, setShowBubble] = useState(false)
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 })
  const [detectedKeyword, setDetectedKeyword] = useState("")
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [showCommentPopup, setShowCommentPopup] = useState(false)
  const [commentPosition, setCommentPosition] = useState({ top: 0, left: 0 })
  const [currentCursorPosition, setCurrentCursorPosition] = useState(0)
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML()
      onChange(newContent)

      if (!isReviewMode) {
        const text = editor.getText().toLowerCase()
        const foundKeyword = TRIGGER_KEYWORDS.find((keyword) => text.includes(keyword))

        if (foundKeyword) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }

          typingTimeoutRef.current = setTimeout(() => {
            setDetectedKeyword(foundKeyword)

            if (editorRef.current && editor.view.dom) {
              const { state } = editor
              const { from } = state.selection
              const domAtPos = editor.view.domAtPos(from)
              const node = domAtPos.node as HTMLElement

              let lineElement = node
              if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
                lineElement = node.parentElement
              }

              while (
                lineElement &&
                lineElement !== editor.view.dom &&
                !lineElement.matches("p, h1, h2, h3, h4, h5, h6, li, blockquote")
              ) {
                if (lineElement.parentElement) {
                  lineElement = lineElement.parentElement
                } else {
                  break
                }
              }

              if (lineElement) {
                const lineRect = lineElement.getBoundingClientRect()
                const editorRect = editorRef.current.getBoundingClientRect()

                setBubblePosition({
                  top: lineRect.top + window.scrollY,
                  left: editorRect.left + window.scrollX - 60,
                })
              } else {
                const rect = editorRef.current.getBoundingClientRect()
                setBubblePosition({
                  top: rect.top + window.scrollY + 100,
                  left: rect.left + window.scrollX - 60,
                })
              }
              setShowBubble(true)
            }
          }, 1500)
        } else {
          setShowBubble(false)
        }
      } else {
        setShowBubble(false)
      }
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3",
      },
      handleClick: (view, pos, event) => {
        if (isReviewMode) {
          const target = event.target as HTMLElement

          if (target.classList.contains("comment-icon")) {
            const commentId = target.getAttribute("data-comment-id")
            const comment = comments.find((c) => c.id === commentId)
            if (comment) {
              setSelectedComment(comment)
              const rect = target.getBoundingClientRect()
              setCommentPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
              })
              setShowCommentPopup(true)
            }
            return true
          }

          const coords = view.coordsAtPos(pos)
          setCurrentCursorPosition(pos)
          setSelectedComment(null)
          setCommentPosition({
            top: coords.bottom + window.scrollY + 5,
            left: coords.left + window.scrollX,
          })
          setShowCommentPopup(true)
          return true
        }
        return false
      },
    },
  })

  const handleSaveComment = (commentText: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      position: currentCursorPosition,
      text: commentText,
      author: "John Doe",
      timestamp: new Date(),
    }

    setComments([...comments, newComment])
    setShowCommentPopup(false)

    if (editor) {
      editor
        .chain()
        .focus()
        .setTextSelection(currentCursorPosition)
        .insertContent(
          `<span class="comment-icon" data-comment-id="${newComment.id}" style="cursor: pointer; color: #f59e0b; font-weight: bold; margin: 0 2px;">💬</span>`,
        )
        .run()
    }
  }

  const handleInsertTable = (rows: number, cols: number) => {
    if (editor) {
      editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    }
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (editor) {
      const handleSelectionUpdate = () => {
        if (showBubble) {
          setShowBubble(false)
        }
      }

      editor.on("selectionUpdate", handleSelectionUpdate)
      return () => {
        editor.off("selectionUpdate", handleSelectionUpdate)
      }
    }
  }, [editor, showBubble])

  useEffect(() => {
    if (isReviewMode) {
      setShowBubble(false)
    }
  }, [isReviewMode])

  const isSection26 = sectionNumber?.startsWith("2.6")

  if (!editor) {
    return null
  }

  return (
    <>
      <div className="border border-border rounded-lg bg-card" ref={editorRef}>
        <div className="border-b border-border">
          {/* First row: Action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-1 p-2 border-b border-border">
            <div className="flex items-center flex-wrap gap-1">
              <Button
                variant="default"
                size="sm"
                className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white h-8 px-3"
              >
                <Sparkles className="h-4 w-4" />
                Regenerate with AI Draft Assistant
              </Button>

              <Button
                variant={isReviewMode ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsReviewMode(!isReviewMode)}
                className={cn("h-8 px-3 gap-2", isReviewMode && "bg-amber-500 hover:bg-amber-600 text-white")}
              >
                <FilePenLine className="h-4 w-4" />
                Review {isReviewMode && "On"}
              </Button>

              {isSection26 && (
                <Button variant="outline" size="sm" onClick={() => setShowTableDialog(true)} className="h-8 px-3 gap-2">
                  <TableIcon className="h-4 w-4" />
                  Select Tables
                </Button>
              )}
            </div>

            {materialsCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenMaterials}
                className="h-8 px-3 gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 border-blue-200 dark:border-blue-800"
              >
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  My Materials ({materialsCount})
                </span>
              </Button>
            )}
          </div>

          {/* Second row: Formatting buttons */}
          <div className="flex items-center flex-wrap gap-1 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="h-8 w-8 p-0"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="h-8 w-8 p-0"
            >
              <Redo className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 1 }) && "bg-accent")}
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 2 }) && "bg-accent")}
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 3 }) && "bg-accent")}
            >
              <Heading3 className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-accent")}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-accent")}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("underline") && "bg-accent")}
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("bulletList") && "bg-accent")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("orderedList") && "bg-accent")}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("blockquote") && "bg-accent")}
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={cn("h-8 w-8 p-0", editor.isActive("codeBlock") && "bg-accent")}
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTableDialog(true)}
              className="h-8 w-8 p-0"
              title="Insert Table"
            >
              <TableIcon className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: "left" }) && "bg-accent")}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: "center" }) && "bg-accent")}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: "right" }) && "bg-accent")}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: "justify" }) && "bg-accent")}
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className={cn(isReviewMode && "cursor-pointer")}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {showBubble && (
        <SmartAssistantBubble
          position={bubblePosition}
          keyword={detectedKeyword}
          onClose={() => setShowBubble(false)}
        />
      )}

      {showCommentPopup && (
        <CommentPopup
          position={commentPosition}
          comment={selectedComment}
          onSave={handleSaveComment}
          onClose={() => setShowCommentPopup(false)}
        />
      )}

      <TableInsertDialog open={showTableDialog} onOpenChange={setShowTableDialog} onInsert={handleInsertTable} />
    </>
  )
}

const TRIGGER_KEYWORDS = [
  "pharmacology",
  "pharmacokinetic",
  "toxicology",
  "nonclinical",
  "kinase inhibitor",
  "efficacy",
  "safety",
  "bioavailability",
]
