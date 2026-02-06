// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
export interface TourStep {
  id: string
  title: string
  description: string
  targetSelector: string
  position: "top" | "bottom" | "left" | "right"
}

export const tourSteps: TourStep[] = [
  {
    id: "subsection-header",
    title: "Subsection Title",
    description:
      "This is the subsection title. Click on it to edit the header text. Press Enter or click outside to save changes.",
    targetSelector: "[data-tour='section-title']",
    position: "bottom",
  },
  {
    id: "see-details-template",
    title: "View & Edit Template",
    description:
      "View Filyn's proprietary, customizable template informed by FDA and ICH guidelines, Filyn's regulatory expertise, and prior project experience. Use it as-is, modify it, or skip it entirely.",
    targetSelector: "[data-tour='detailed-template']",
    position: "bottom",
  },
  {
    id: "jump-nav",
    title: "Jump To Section",
    description: "View and update this section's status: Draft or Accepted. Toggle Required on or off as needed.",
    targetSelector: "[data-tour='jump-navigation']",
    position: "bottom",
  },
  {
    id: "status",
    title: "Section Status",
    description:
      "View the current status of this section - Draft, In Review, or Approved. Required sections are marked with a red badge.",
    targetSelector: "[data-tour='status']",
    position: "bottom",
  },
  {
    id: "editor-toolbar",
    title: "Content Editor",
    description:
      "Use the formatting toolbar to style your content. The AI Draft Assistant supports content drafting using built-in templates and user-provided inputs.",
    targetSelector: "[data-tour='editor-toolbar']",
    position: "top",
  },
]
