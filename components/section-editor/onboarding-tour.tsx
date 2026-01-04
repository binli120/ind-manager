"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, ArrowRight, ArrowLeft } from "lucide-react"
import { tourSteps } from "@/config/tutorial-steps"

interface OnboardingTourProps {
  isOpen: boolean
  onClose: () => void
}

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })

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
        className="fixed z-[102] w-80 bg-white dark:bg-gray-900 border-2 border-blue-500 rounded-lg shadow-2xl p-6 transition-all duration-300"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform:
            currentTourStep.position === "right" || currentTourStep.position === "left"
              ? "translateY(-50%)"
              : "translateX(-50%)",
        }}
      >
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
        <div className="pr-6">
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
