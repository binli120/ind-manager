// Author: Bin Lee
// Email: binlee120@gmail.com
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableCell } from "@tiptap/extension-table-cell"
import { Minus, Plus, Trash2, Columns3, Rows3 } from "lucide-react"

interface TableEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialContent?: string
  onSave: (content: string) => void
}

export function TableEditorDialog({ open, onOpenChange, initialContent, onSave }: TableEditorDialogProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-border w-full",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "bg-muted font-semibold",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-border p-2 min-w-[100px]",
        },
      }),
    ],
    content:
      initialContent ||
      "<table><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr><tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr></table>",
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[400px] p-4",
      },
    },
  })

  const handleSave = () => {
    if (editor) {
      onSave(editor.getHTML())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Table Template</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 pb-4 border-b flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().addColumnBefore().run()}
            disabled={!editor?.can().addColumnBefore()}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Column Before
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().addColumnAfter().run()}
            disabled={!editor?.can().addColumnAfter()}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Column After
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().deleteColumn().run()}
            disabled={!editor?.can().deleteColumn()}
            className="gap-2"
          >
            <Minus className="h-4 w-4" />
            Delete Column
          </Button>

          <div className="w-px h-6 bg-border" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().addRowBefore().run()}
            disabled={!editor?.can().addRowBefore()}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Row Before
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().addRowAfter().run()}
            disabled={!editor?.can().addRowAfter()}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Row After
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().deleteRow().run()}
            disabled={!editor?.can().deleteRow()}
            className="gap-2"
          >
            <Minus className="h-4 w-4" />
            Delete Row
          </Button>

          <div className="w-px h-6 bg-border" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().deleteTable().run()}
            disabled={!editor?.can().deleteTable()}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Table
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().toggleHeaderRow().run()}
            disabled={!editor?.can().toggleHeaderRow()}
            className="gap-2"
          >
            <Rows3 className="h-4 w-4" />
            Toggle Header Row
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().toggleHeaderColumn().run()}
            disabled={!editor?.can().toggleHeaderColumn()}
            className="gap-2"
          >
            <Columns3 className="h-4 w-4" />
            Toggle Header Column
          </Button>
        </div>

        <div className="border rounded-md overflow-auto max-h-[calc(90vh-250px)]">
          <EditorContent editor={editor} />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Table</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
