// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"

interface DeleteSubsectionDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  subsectionNumber: string
  onConfirm: () => void
}

export function DeleteSubsectionDialog({
  open,
  onOpenChangeAction,
  subsectionNumber,
  onConfirm,
}: DeleteSubsectionDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChangeAction(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Element
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete section <span className="font-semibold">{subsectionNumber}</span>? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChangeAction(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
