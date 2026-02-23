// Author: Bin Lee
// Email: binlee120@gmail.com
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, ArrowRight, ArrowLeft, GripHorizontal } from "lucide-react"
import { tourSteps } from "@/config/tutorial-steps"

interface OnboardingTourProps {
  isOpen: boolean
  onClose: () => void
}

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })

  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const dragStartPos = useRef({ x: 0, y: 0 })
  const startOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    setDragOffset({ x: 0, y: 0 })
  }, [currentStep])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const deltaX = e.clientX - dragStartPos.current.x
      const deltaY = e.clientY - dragStartPos.current.y

      setDragOffset({
        x: startOffset.current.x + deltaX,
        y: startOffset.current.y + deltaY,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  const handleMouseDown = (e: React.MouseEvent) => {
    //Stops the dragging if clicking a button
    if ((e.target as HTMLElement).closest("button")) return

    setIsDragging(true)
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    startOffset.current = { ...dragOffset }
  }

  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      const step = tourSteps[currentStep]
      const element = document.querySelector(step.targetSelector)

      if (element) {
        const rect = element.getBoundingClientRect()
        setHighlightRect(rect)

        // Calculate tooltip position based on step position preference
        let top = 0
        let left = 0

        switch (step.position) {
          case "right":
            top = rect.top + rect.height / 2
            left = rect.right + 20
            break
          case "left":
            top = rect.top + rect.height / 2
            left = rect.left - 320 - 20
            break
          case "top":
            top = rect.top - 20
            left = rect.left + rect.width / 2
            break
          case "bottom":
            top = rect.bottom + 20
            left = rect.left + rect.width / 2
            break
        }

        setTooltipPosition({ top, left })
      }
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [currentStep, isOpen])

  if (!isOpen) return null

  const currentTourStep = tourSteps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === tourSteps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      onClose()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[100] cursor-pointer"
        onClick={onClose}
        aria-label="Close tour overlay"
      />

      {/* Highlight box */}
      {highlightRect && (
        <div
          className="fixed border-4 border-blue-500 rounded-lg shadow-2xl z-[101] pointer-events-none transition-all duration-300"
          style={{
            top: `${highlightRect.top - 4}px`,
            left: `${highlightRect.left - 4}px`,
            width: `${highlightRect.width + 8}px`,
            height: `${highlightRect.height + 8}px`,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        onMouseDown={handleMouseDown}
        className={`fixed z-[102] w-80 bg-white dark:bg-gray-900 border-2 border-blue-500 rounded-lg shadow-2xl p-6 
          ${isDragging ? "cursor-grabbing transition-none" : "cursor-grab transition-all duration-300"}`}
        style={{
          top: `${tooltipPosition.top + dragOffset.y}px`,
          left: `${tooltipPosition.left + dragOffset.x}px`,
          transform:
            currentTourStep.position === "right" || currentTourStep.position === "left"
              ? "translateY(-50%)"
              : "translateX(-50%)",
        }}
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-gray-300 dark:text-gray-600">
           <GripHorizontal className="h-4 w-4" />
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={onClose}
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="pr-6 pt-2 select-none">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{currentTourStep.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{currentTourStep.description}</p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button onClick={handleNext} size="sm" className="gap-2">
              {isLastStep ? "Finish" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
