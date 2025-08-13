"use client"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TopNavProps {
  currentTab: "backgrounds" | "text" | "demo" | "music" | "export"
  onTabChange: (tab: "backgrounds" | "text" | "demo" | "music" | "export") => void
  uploadedFiles?: any[]
  demoVideos?: any[]
  selectedMusic?: string | null
}

const steps = [
  { name: "Backgrounds", tab: "backgrounds" as const, step: 1 },
  { name: "Text", tab: "text" as const, step: 2 },
  { name: "Demo", tab: "demo" as const, step: 3 },
  { name: "Music", tab: "music" as const, step: 4 },
  { name: "Export", tab: "export" as const, step: 5 },
]

export default function TopNav({
  currentTab,
  onTabChange,
  uploadedFiles = [],
  demoVideos = [],
  selectedMusic = null,
}: TopNavProps) {
  const getCurrentStep = () => {
    const currentStep = steps.find((step) => step.tab === currentTab)
    return currentStep?.step || 1
  }

  const currentStepNumber = getCurrentStep()

  const handleNext = () => {
    if (currentTab === "backgrounds") onTabChange("text")
    else if (currentTab === "text") onTabChange("demo")
    else if (currentTab === "demo") onTabChange("music")
    else if (currentTab === "music") onTabChange("export")
  }

  const handleBack = () => {
    if (currentTab === "text") onTabChange("backgrounds")
    else if (currentTab === "demo") onTabChange("text")
    else if (currentTab === "music") onTabChange("demo")
    else if (currentTab === "export") onTabChange("music")
  }

  const canGoBack = currentTab !== "backgrounds"
  const canGoNext = () => {
    if (currentTab === "backgrounds") return uploadedFiles.length > 0
    if (currentTab === "text") return true
    if (currentTab === "demo") return demoVideos.length > 0
    if (currentTab === "music") return selectedMusic !== null
    return false
  }

  return (
    <nav className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between">
          {/* Left side - Steps */}
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const isCompleted = step.step < currentStepNumber
              const isCurrent = step.step === currentStepNumber
              const isUpcoming = step.step > currentStepNumber

              return (
                <div key={step.name} className="flex items-center">
                  <div className="flex items-center">
                    {/* Step Circle */}
                    <div className="flex items-center justify-center">
                      <div
                        className={`
                          flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                          ${
                            isCompleted
                              ? "bg-black text-white"
                              : isCurrent
                                ? "bg-black text-white ring-1 ring-black ring-offset-1"
                                : "bg-gray-200 text-gray-500"
                          }
                        `}
                      >
                        {isCompleted ? (
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          step.step
                        )}
                      </div>
                    </div>

                    {/* Step Label */}
                    <button
                      onClick={() => onTabChange(step.tab)}
                      className={`
                        ml-2 text-xs font-medium transition-colors duration-200
                        ${
                          isCompleted || isCurrent
                            ? "text-black hover:text-gray-600"
                            : "text-gray-400 cursor-not-allowed"
                        }
                      `}
                      disabled={isUpcoming}
                    >
                      {step.name}
                    </button>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        ml-4 h-px w-8
                        ${step.step < currentStepNumber ? "bg-black" : "bg-gray-200"}
                      `}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center space-x-2">
            {canGoBack && (
              <button
                onClick={handleBack}
                className="flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-100"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Back
              </button>
            )}
            {currentTab !== "export" && (
              <button
                onClick={handleNext}
                disabled={!canGoNext()}
                className={`
                  flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors
                  ${canGoNext() ? "bg-black text-white hover:bg-gray-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}
                `}
              >
                Next
                <ChevronRight className="h-3 w-3 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
