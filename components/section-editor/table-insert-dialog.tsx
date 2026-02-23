// Author: Bin Lee
// Email: binlee120@gmail.com
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TableInsertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (rows: number, cols: number) => void
}

export function TableInsertDialog({ open, onOpenChange, onInsert }: TableInsertDialogProps) {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)

  const handleInsert = () => {
    if (rows > 0 && cols > 0) {
      onInsert(rows, cols)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rows">Rows</Label>
            <Input
              id="rows"
              type="number"
              min="1"
              max="20"
              value={rows}
              onChange={(e) => setRows(Math.max(1, Number.parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cols">Columns</Label>
            <Input
              id="cols"
              type="number"
              min="1"
              max="10"
              value={cols}
              onChange={(e) => setCols(Math.max(1, Number.parseInt(e.target.value) || 1))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
