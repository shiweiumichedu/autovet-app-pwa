import React, { useRef } from 'react'
import { Upload, Trash2, FileText, Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { CustomerReport, CustomerReportType } from '../types'
import { useReportUpload } from '../hooks/useReportUpload'

interface Props {
  reports: CustomerReport[]
  inspectionId: string
  vehicleInfo: { year?: number | null; make?: string; model?: string; trim?: string }
  onReportChange: () => void
}

const REPORT_SLOTS: { type: CustomerReportType; label: string }[] = [
  { type: 'obd2', label: 'OBD II Report' },
  { type: 'carfax', label: 'CarFax Report' },
  { type: 'autocheck', label: 'AutoCheck Report' },
]

const verdictConfig = {
  ok: { label: 'OK', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle },
  warning: { label: 'Warning', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: AlertTriangle },
  issue: { label: 'Issue', color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle },
} as const

export const CustomerReportUpload: React.FC<Props> = ({
  reports,
  inspectionId,
  vehicleInfo,
  onReportChange,
}) => {
  const { uploading, analyzing, uploadReport, analyzeReport, deleteReport } = useReportUpload()
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const getReport = (type: CustomerReportType) =>
    reports.find((r) => r.reportType === type)

  const handleFileSelect = async (type: CustomerReportType, file: File) => {
    const result = await uploadReport(file, inspectionId, type)
    if (result) {
      onReportChange()
      // Auto-analyze after upload
      await analyzeReport(result.id, result.fileUrl, type, result.fileType, vehicleInfo)
      onReportChange()
    }
  }

  const handleDelete = async (report: CustomerReport) => {
    const ok = await deleteReport(report.id, inspectionId, report.reportType)
    if (ok) onReportChange()
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-3 mb-3">
      <div className="flex items-center space-x-1.5 mb-2">
        <FileText className="w-4 h-4 text-blue-500" />
        <h2 className="text-sm font-semibold text-gray-900">Customer Reports</h2>
      </div>
      <p className="text-[10px] text-gray-500 mb-2">
        Upload OBD II, CarFax, or AutoCheck reports for AI analysis
      </p>
      <div className="space-y-2">
        {REPORT_SLOTS.map(({ type, label }) => {
          const report = getReport(type)
          const isUploading = uploading === type
          const isAnalyzing = analyzing === type

          return (
            <div
              key={type}
              className="border rounded-lg p-2.5"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">{label}</span>
                {report && !isUploading && !isAnalyzing && (
                  <button
                    onClick={() => handleDelete(report)}
                    className="text-red-400 hover:text-red-600 p-0.5 touch-manipulation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isUploading ? (
                <div className="flex items-center space-x-2 text-xs text-blue-600 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : isAnalyzing ? (
                <div className="flex items-center space-x-2 text-xs text-purple-600 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing with AI...</span>
                </div>
              ) : report ? (
                <div>
                  <div className="flex items-center space-x-1.5 text-[10px] text-gray-500 mb-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="truncate">{report.fileName}</span>
                  </div>
                  {report.aiVerdict && (
                    <div className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded border text-[10px] font-medium mb-1 ${verdictConfig[report.aiVerdict].color}`}>
                      {React.createElement(verdictConfig[report.aiVerdict].icon, { className: 'w-2.5 h-2.5' })}
                      <span>{verdictConfig[report.aiVerdict].label}</span>
                    </div>
                  )}
                  {report.aiAnalysis ? (
                    <div className="bg-gray-50 rounded p-2 text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {report.aiAnalysis}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic">Analysis pending...</p>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    ref={(el) => { fileInputRefs.current[type] = el }}
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileSelect(type, file)
                        e.target.value = ''
                      }
                    }}
                  />
                  <button
                    onClick={() => fileInputRefs.current[type]?.click()}
                    className="w-full flex items-center justify-center space-x-1.5 py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors touch-manipulation"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload PDF or Image</span>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
