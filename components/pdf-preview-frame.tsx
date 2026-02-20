"use client";

import { memo } from "react";

interface PdfPreviewFrameProps {
  src: string;
  title?: string;
  className?: string;
}

function PdfPreviewFrameComponent({
  src,
  title = "PDF Preview",
  className = "w-full h-[80vh] border-0",
}: PdfPreviewFrameProps) {
  return <iframe src={src} className={className} title={title} />;
}

export const PdfPreviewFrame = memo(PdfPreviewFrameComponent);
PdfPreviewFrame.displayName = "PdfPreviewFrame";
