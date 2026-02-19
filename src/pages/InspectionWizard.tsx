import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react'
import { useTenant } from '../hooks/useTenant'
import { useInspection } from '../hooks/useInspection'
import { usePhotoUpload } from '../hooks/usePhotoUpload'
import { InspectionProgress } from '../components/InspectionProgress'
import { StepChecklist } from '../components/StepChecklist'
import { PhotoCapture } from '../components/PhotoCapture'
import { ChecklistItem, InspectionStep } from '../types'

export const InspectionWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { tenant } = useTenant()
  const navigate = useNavigate()
  const {
    inspection,
    loading,
    loadInspection,
    updateStep,
    updateCurrentStep,
  } = useInspection()
  const { uploading, analyzing, error: photoError, uploadPhoto, deletePhoto, analyzePhoto } = usePhotoUpload()

  const [currentStepNum, setCurrentStepNum] = useState(2) // Start at step 2 (step 1 = vehicle info, done)
  const [stepNotes, setStepNotes] = useState('')
  const [stepRating, setStepRating] = useState<number>(0)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [saving, setSaving] = useState(false)

  const basePath = tenant ? `/${tenant}` : ''

  // Load inspection on mount
  useEffect(() => {
    if (id) {
      loadInspection(id)
    }
  }, [id, loadInspection])

  // Sync local state when inspection loads
  useEffect(() => {
    if (inspection) {
      // Start at the inspection's saved current step (but at least 2)
      if (inspection.currentStep >= 2) {
        setCurrentStepNum(inspection.currentStep)
      }
      const step = inspection.steps?.find((s) => s.stepNumber === (inspection.currentStep >= 2 ? inspection.currentStep : 2))
      if (step) {
        setStepNotes(step.notes || '')
        setStepRating(step.rating || 0)
        setChecklist(step.checklist || [])
      }
    }
  }, [inspection?.id]) // Only on initial load

  // Update local state when navigating to a different step
  useEffect(() => {
    if (inspection) {
      const step = inspection.steps?.find((s) => s.stepNumber === currentStepNum)
      if (step) {
        setStepNotes(step.notes || '')
        setStepRating(step.rating || 0)
        setChecklist(step.checklist || [])
      }
    }
  }, [currentStepNum, inspection])

  const currentStep: InspectionStep | undefined = inspection?.steps?.find(
    (s) => s.stepNumber === currentStepNum
  )

  const totalSteps = inspection?.steps?.length || 7
  const completedSteps = new Set(
    (inspection?.steps || [])
      .filter((s) => s.status === 'completed')
      .map((s) => s.stepNumber)
  )
  const stepNames = (inspection?.steps || []).map((s) => s.stepName)

  const isTestDriveStep = currentStepNum === 7
  const isPhotoStep = currentStepNum >= 2 && currentStepNum <= 6

  const handleChecklistChange = useCallback(
    (items: ChecklistItem[]) => {
      setChecklist(items)
    },
    []
  )

  const saveCurrentStep = useCallback(async () => {
    if (!currentStep) return

    setSaving(true)
    try {
      await updateStep(currentStep.id, {
        checklist,
        notes: stepNotes,
        rating: stepRating || undefined,
        status: 'completed',
      })
    } finally {
      setSaving(false)
    }
  }, [currentStep, checklist, stepNotes, stepRating, updateStep])

  const handleNext = async () => {
    await saveCurrentStep()

    if (currentStepNum >= totalSteps) {
      // Go to summary
      if (id) {
        await updateCurrentStep(id, totalSteps)
      }
      navigate(`${basePath}/inspect/${id}/summary`)
    } else {
      const nextStep = currentStepNum + 1
      setCurrentStepNum(nextStep)
      if (id) {
        await updateCurrentStep(id, nextStep)
      }
    }
  }

  const handlePrev = async () => {
    // Save current step state before going back
    if (currentStep) {
      await updateStep(currentStep.id, {
        checklist,
        notes: stepNotes,
        rating: stepRating || undefined,
      })
    }

    if (currentStepNum <= 2) {
      navigate(`${basePath}/dashboard`)
    } else {
      setCurrentStepNum(currentStepNum - 1)
    }
  }

  const handlePhotoCapture = async (file: File, photoOrder: number) => {
    if (!id || !currentStep) return
    const result = await uploadPhoto(file, id, currentStep.id, currentStepNum, photoOrder)
    if (result) {
      // Reload inspection to get updated photos
      await loadInspection(id)
      // Trigger AI analysis in background
      analyzePhoto(result.id, result.photoUrl, currentStep.stepName, {
        year: inspection?.vehicleYear,
        make: inspection?.vehicleMake,
        model: inspection?.vehicleModel,
        trim: inspection?.vehicleTrim,
      }).then(() => {
        // Reload to show analysis results
        if (id) loadInspection(id)
      })
    }
  }

  const handlePhotoDelete = async (photo: { id: string; photoOrder: number }) => {
    if (!id) return
    const success = await deletePhoto(photo.id, id, currentStepNum, photo.photoOrder)
    if (success) {
      await loadInspection(id)
    }
  }

  if (loading && !inspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-3">Inspection not found.</p>
        <button
          onClick={() => navigate(`${basePath}/dashboard`)}
          className="text-blue-600 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`${basePath}/dashboard`)}
              className="mr-2 p-1 rounded-lg hover:bg-gray-100 touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-gray-900">
                {inspection.vehicleYear} {inspection.vehicleMake} {inspection.vehicleModel}
              </h1>
              <p className="text-[10px] text-gray-500">
                {inspection.vehicleTrim}{inspection.vehicleTrim && inspection.vehicleColor ? ' | ' : ''}{inspection.vehicleColor}
              </p>
            </div>
          </div>
          <button
            onClick={saveCurrentStep}
            disabled={saving}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 touch-manipulation disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b px-3 py-2">
        <InspectionProgress
          currentStep={currentStepNum}
          totalSteps={totalSteps}
          stepNames={stepNames}
          completedSteps={completedSteps}
        />
      </div>

      {/* Step Content */}
      <main className="max-w-7xl mx-auto px-3 py-1.5 flex-1 w-full">
        {currentStep && (
          <>
            {/* Step Title */}
            <div className="bg-white rounded-lg shadow-sm border px-3 py-1.5 mb-1.5">
              <h2 className="text-sm font-semibold text-gray-900">{currentStep.stepName}</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {isTestDriveStep
                  ? 'Note engine performance, braking, steering feel, and any unusual noises.'
                  : `Tap each item to mark as checked.`}
              </p>
            </div>

            {/* Checklist */}
            {checklist.length > 0 && (
              <div className="mb-1.5">
                <StepChecklist
                  items={checklist}
                  onChange={handleChecklistChange}
                />
              </div>
            )}

            {/* Photo Capture (steps 2-6 only) */}
            {isPhotoStep && (
              <div className="bg-white rounded-lg shadow-sm border px-3 py-1.5 mb-1.5">
                <h3 className="text-[11px] font-medium text-gray-600 mb-1">Photos (max 2)</h3>
                <PhotoCapture
                  photos={currentStep.photos || []}
                  maxPhotos={2}
                  uploading={uploading}
                  analyzing={analyzing}
                  onCapture={handlePhotoCapture}
                  onDelete={handlePhotoDelete}
                />
                {photoError && (
                  <p className="text-[10px] text-red-500 mt-1">{photoError}</p>
                )}
              </div>
            )}

            {/* Notes + Rating combined */}
            <div className="bg-white rounded-lg shadow-sm border px-3 py-1.5 mb-1.5">
              <h3 className="text-[11px] font-medium text-gray-600 mb-1">
                {isTestDriveStep ? 'Test Drive Notes' : 'Notes'}
              </h3>
              <textarea
                value={stepNotes}
                onChange={(e) => setStepNotes(e.target.value)}
                placeholder={
                  isTestDriveStep
                    ? 'Describe the test drive experience...'
                    : 'Any additional observations...'
                }
                rows={isTestDriveStep ? 4 : 2}
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                style={{ fontSize: '16px' }}
              />
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex space-x-3 mt-2">
          <button
            onClick={handlePrev}
            className="flex-1 flex items-center justify-center space-x-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{currentStepNum <= 2 ? 'Exit' : 'Previous'}</span>
          </button>
          <button
            onClick={handleNext}
            disabled={saving}
            className="flex-1 flex items-center justify-center space-x-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 touch-manipulation"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{currentStepNum >= totalSteps ? 'Review' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
