import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Star, Check, X, Camera, FileText,
  Loader2, ThumbsUp, ThumbsDown, AlertCircle, AlertTriangle,
} from 'lucide-react'
import { useTenant } from '../hooks/useTenant'
import { useInspection } from '../hooks/useInspection'
import { KnownIssueCard } from '../components/KnownIssueCard'

export const InspectionSummary: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { tenant } = useTenant()
  const navigate = useNavigate()
  const {
    inspection,
    loading,
    loadInspection,
    completeInspection,
  } = useInspection()

  const [overallRating, setOverallRating] = useState(0)
  const [generalNotes, setGeneralNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  const basePath = tenant ? `/${tenant}` : ''

  useEffect(() => {
    if (id) {
      loadInspection(id)
    }
  }, [id, loadInspection])

  useEffect(() => {
    if (inspection) {
      setOverallRating(inspection.overallRating || 0)
      setGeneralNotes(inspection.notes || '')
      if (inspection.status === 'completed' || inspection.status === 'passed') {
        setCompleted(true)
      }
    }
  }, [inspection])

  const handleDecision = async (decision: 'interested' | 'pass') => {
    if (!id || !overallRating) return

    setSubmitting(true)
    try {
      const success = await completeInspection(id, overallRating, decision, generalNotes)
      if (success) {
        setCompleted(true)
        await loadInspection(id)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerateReport = () => {
    // PDF generation via Edge Function — placeholder for now
    alert('PDF report generation will be available soon. The Edge Function needs to be deployed separately.')
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

  const steps = inspection.steps || []
  const totalPhotos = steps.reduce((acc, s) => acc + (s.photos?.length || 0), 0)
  const completedChecks = steps.reduce(
    (acc, s) => acc + s.checklist.filter((c) => c.checked).length,
    0
  )
  const totalChecks = steps.reduce((acc, s) => acc + s.checklist.length, 0)

  // Weighted score calculation
  const weightedEarned = steps.reduce(
    (acc, s) => acc + s.checklist.reduce((sum, c) => sum + (c.weight ?? 1) * c.rating, 0),
    0
  )
  const weightedMax = steps.reduce(
    (acc, s) => acc + s.checklist.filter((c) => (c.weight ?? 1) > 0).reduce((sum, c) => sum + (c.weight ?? 1) * 5, 0),
    0
  )
  const weightedPct = weightedMax > 0 ? Math.round((weightedEarned / weightedMax) * 100) : 0
  const scoreColor = weightedPct >= 70 ? 'text-green-600' : weightedPct >= 40 ? 'text-yellow-600' : 'text-red-600'
  const scoreBg = weightedPct >= 70 ? 'bg-green-50 border-green-200' : weightedPct >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center">
          <button
            onClick={() => navigate(`${basePath}/inspect/${id}`)}
            className="mr-3 p-1 rounded-lg hover:bg-gray-100 touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Inspection Summary</h1>
            <p className="text-[10px] text-gray-500">
              {inspection.vehicleYear} {inspection.vehicleMake} {inspection.vehicleModel} {inspection.vehicleTrim}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 py-3 flex-1 w-full">
        {/* Vehicle Info */}
        <div className="bg-white rounded-lg shadow-sm border p-3 mb-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Vehicle</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Year:</span>{' '}
              <span className="font-medium">{inspection.vehicleYear || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Make:</span>{' '}
              <span className="font-medium">{inspection.vehicleMake}</span>
            </div>
            <div>
              <span className="text-gray-500">Model:</span>{' '}
              <span className="font-medium">{inspection.vehicleModel}</span>
            </div>
            <div>
              <span className="text-gray-500">Trim:</span>{' '}
              <span className="font-medium">{inspection.vehicleTrim || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Mileage:</span>{' '}
              <span className="font-medium">
                {inspection.vehicleMileage
                  ? inspection.vehicleMileage.toLocaleString()
                  : '-'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Color:</span>{' '}
              <span className="font-medium">{inspection.vehicleColor || '-'}</span>
            </div>
            {inspection.vehicleVin && (
              <div className="col-span-2">
                <span className="text-gray-500">VIN:</span>{' '}
                <span className="font-medium font-mono">{inspection.vehicleVin}</span>
              </div>
            )}
          </div>
        </div>

        {/* Known Issues */}
        {inspection.knownIssues && inspection.knownIssues.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-3 mb-3">
            <div className="flex items-center space-x-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <h2 className="text-sm font-semibold text-gray-900">
                Known Issues ({inspection.knownIssues.length})
              </h2>
            </div>
            <div className="space-y-2">
              {inspection.knownIssues.map((issue) => (
                <KnownIssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white rounded-lg shadow-sm border p-2 text-center">
            <div className="flex items-center justify-center mb-1">
              <Check className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-500">Checks</p>
            <p className="text-sm font-semibold">
              {completedChecks}/{totalChecks}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-2 text-center">
            <div className="flex items-center justify-center mb-1">
              <Camera className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500">Photos</p>
            <p className="text-sm font-semibold">{totalPhotos}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-2 text-center">
            <div className="flex items-center justify-center mb-1">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-xs text-gray-500">Steps</p>
            <p className="text-sm font-semibold">
              {steps.filter((s) => s.status === 'completed').length}/{steps.length}
            </p>
          </div>
        </div>

        {/* Weighted Score */}
        {weightedMax > 0 && (
          <div className={`rounded-lg shadow-sm border p-3 mb-3 ${scoreBg}`}>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Weighted Score</h2>
            <div className="flex items-baseline space-x-2">
              <span className={`text-2xl font-bold ${scoreColor}`}>{weightedPct}%</span>
              <span className="text-xs text-gray-500">
                {weightedEarned} / {weightedMax} pts
              </span>
            </div>
            <div className="mt-1.5 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  weightedPct >= 70 ? 'bg-green-500' : weightedPct >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${weightedPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Step-by-Step Review */}
        <div className="bg-white rounded-lg shadow-sm border p-3 mb-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Step Results</h2>
          <div className="space-y-2">
            {steps
              .filter((s) => s.stepNumber >= 2) // Skip vehicle info step
              .map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-2">
                    {step.status === 'completed' ? (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : step.status === 'skipped' ? (
                      <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className="text-sm text-gray-900">{step.stepName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {step.photos && step.photos.length > 0 && (
                      <span className="text-[10px] text-gray-500">
                        {step.photos.length} photo{step.photos.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {step.rating && (
                      <div className="flex items-center space-x-0.5">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <Star
                            key={r}
                            className={`w-3 h-3 ${
                              r <= step.rating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Overall Rating */}
        <div className="bg-white rounded-lg shadow-sm border p-3 mb-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Overall Rating</h2>
          <div className="flex justify-center space-x-3">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => !completed && setOverallRating(rating === overallRating ? 0 : rating)}
                disabled={completed}
                className="touch-manipulation disabled:cursor-default"
              >
                <Star
                  className={`w-9 h-9 ${
                    rating <= overallRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* General Notes */}
        <div className="bg-white rounded-lg shadow-sm border p-3 mb-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">General Notes</h2>
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Overall impressions, concerns, etc."
            rows={3}
            disabled={completed}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Decision */}
        {!completed ? (
          <div className="space-y-2">
            {!overallRating && (
              <p className="text-xs text-center text-red-500">
                Please set an overall rating before making a decision.
              </p>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => handleDecision('pass')}
                disabled={!overallRating || submitting}
                className="flex-1 flex items-center justify-center space-x-2 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 touch-manipulation"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ThumbsDown className="w-5 h-5" />
                    <span>Pass</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleDecision('interested')}
                disabled={!overallRating || submitting}
                className="flex-1 flex items-center justify-center space-x-2 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 touch-manipulation"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ThumbsUp className="w-5 h-5" />
                    <span>Interested</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Decision Badge */}
            <div
              className={`text-center py-3 rounded-lg font-medium ${
                inspection.decision === 'interested'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              {inspection.decision === 'interested' ? (
                <div className="flex items-center justify-center space-x-2">
                  <ThumbsUp className="w-5 h-5" />
                  <span>Interested</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <ThumbsDown className="w-5 h-5" />
                  <span>Passed</span>
                </div>
              )}
            </div>

            {/* Generate Report (only for interested) */}
            {inspection.decision === 'interested' && (
              <button
                onClick={handleGenerateReport}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors touch-manipulation"
              >
                <FileText className="w-5 h-5" />
                <span>Generate PDF Report</span>
              </button>
            )}

            {/* Back to Dashboard */}
            <button
              onClick={() => navigate(`${basePath}/dashboard`)}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors touch-manipulation"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
