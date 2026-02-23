// Author: Bin Lee
// Email: binlee120@gmail.com
"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface AddSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionNumber: string
  existingSubsections: ExistingSubsection[]
  onAddSection: (subsectionNumber: string, header: string) => void
}

type ExistingSubsection = {
  subsectionNumber?: string
}

const getNextSubsectionLetter = (existingSubsections: ExistingSubsection[]): string => {
  if (!existingSubsections || existingSubsections.length === 0) return "a"

  // Find all subsection numbers that match the pattern
  const letters = existingSubsections
    .map((sub) => {
      const parts = sub.subsectionNumber?.split("-")
      return parts && parts.length > 1 ? parts[parts.length - 1] : null
    })
    .filter((v): v is string => Boolean(v))

  if (letters.length === 0) return "a"

  // Find the last letter
  const lastLetter = letters[letters.length - 1]
  const nextCharCode = lastLetter.charCodeAt(0) + 1

  // Return next letter (a->b, b->c, etc.)
  return String.fromCharCode(nextCharCode)
}

const getDefaultHeader = (letter: string): string => {
  const headerMap: { [key: string]: string } = {
    a: "High-Level Summary of the Nonclinical Program",
    b: "Nonclinical Overview Tables",
    c: "Pharmacology Summary",
    d: "Pharmacokinetics Summary",
    e: "Toxicology Summary",
    f: "Additional Nonclinical Information",
    g: "Supplementary Data",
  }

  return headerMap[letter] || `Subsection ${letter.toUpperCase()}`
}

export function AddSectionDialog({
  open,
  onOpenChange,
  sectionNumber,
  existingSubsections,
  onAddSection,
}: AddSectionDialogProps) {
  const nextLetter = getNextSubsectionLetter(existingSubsections)
  const nextSubsectionNumber = `${sectionNumber}-${nextLetter}`

  const handleAdd = () => {
    onAddSection(nextSubsectionNumber, getDefaultHeader(nextLetter))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add new element</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Section Number:</Label>
            <div className="px-3 py-2 rounded-md bg-muted text-sm font-mono">{nextSubsectionNumber}</div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add Section</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
