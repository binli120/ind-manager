// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Section } from "@/types/section"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface GuidelineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: Section
}

export function GuidelineDialog({ open, onOpenChange, section }: GuidelineDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">FDA Guideline Template</DialogTitle>
          <DialogDescription>
            Section {section.number}: {section.title}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-foreground">Section Requirements</h3>
                {section.isRequired && (
                  <Badge variant="destructive" className="text-xs">
                    REQUIRED
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This section should provide a high-level summary of the nonclinical program, including the rationale for
                the studies conducted, key findings, and how they support the proposed clinical trial.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Content Guidelines</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Brief description of the pharmacological properties and mechanism of action</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Summary of pharmacokinetic characteristics across species</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Overview of toxicology findings and their relevance to clinical development</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Justification for starting dose and dose escalation scheme</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Reference Documents</h3>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-primary hover:underline">
                  ICH M3(R2): Nonclinical Safety Studies for the Conduct of Human Clinical Trials
                </a>
                <a href="#" className="block text-sm text-primary hover:underline">
                  FDA Guidance: Content and Format of INDs for Phase 1 Studies
                </a>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
