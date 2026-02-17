import React from 'react'
import { Check } from 'lucide-react'

interface InspectionProgressProps {
  currentStep: number
  totalSteps: number
  stepNames: string[]
  completedSteps: Set<number>
}

export const InspectionProgress: React.FC<InspectionProgressProps> = ({
  currentStep,
  totalSteps,
  stepNames,
  completedSteps,
}) => {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-xs text-gray-500">
          {stepNames[currentStep - 1] || ''}
        </span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center space-x-1">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1
          const isCompleted = completedSteps.has(stepNum)
          const isCurrent = stepNum === currentStep
          const isPast = stepNum < currentStep

          return (
            <div key={stepNum} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full h-1.5 rounded-full transition-colors ${
                  isCompleted || isPast
                    ? 'bg-green-500'
                    : isCurrent
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
              />
              <div className="mt-1 flex items-center justify-center">
                {isCompleted ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <span
                    className={`text-[9px] font-medium ${
                      isCurrent ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {stepNum}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
