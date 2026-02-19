import React, { useRef, useState } from 'react'
import { Camera, X, Loader2, Brain } from 'lucide-react'
import { InspectionPhoto } from '../types'

interface PhotoCaptureProps {
  photos: InspectionPhoto[]
  maxPhotos: number
  uploading: boolean
  analyzing?: boolean
  onCapture: (file: File, photoOrder: number) => void
  onDelete: (photo: InspectionPhoto) => void
  disabled?: boolean
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  photos,
  maxPhotos,
  uploading,
  analyzing = false,
  onCapture,
  onDelete,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingOrderRef = useRef<number>(1)
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null)

  const handleCapture = (photoOrder: number) => {
    if (disabled || uploading) return
    pendingOrderRef.current = photoOrder
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onCapture(file, pendingOrderRef.current)
    }
    // Reset so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const slots = Array.from({ length: maxPhotos }, (_, i) => {
    const order = i + 1
    return photos.find((p) => p.photoOrder === order) || null
  })

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-1.5">
        {slots.map((photo, i) => {
          const order = i + 1

          if (photo) {
            const isExpanded = expandedPhoto === photo.id
            return (
              <div key={order} className="relative">
                <div
                  className="relative aspect-[3/2] rounded overflow-hidden bg-gray-100 cursor-pointer"
                  onClick={() => setExpandedPhoto(isExpanded ? null : photo.id)}
                >
                  <img
                    src={photo.photoUrl}
                    alt={`Photo ${order}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Analyzing spinner */}
                  {analyzing && !photo.aiVerdict && (
                    <div className="absolute top-0.5 left-0.5 flex items-center space-x-0.5 px-1 py-px rounded bg-blue-500 text-white">
                      <Brain className="w-2.5 h-2.5 animate-pulse" />
                      <span className="text-[9px] font-medium">Analyzing...</span>
                    </div>
                  )}
                  {/* Verdict badge */}
                  {photo.aiVerdict && (
                    <div
                      className={`absolute top-0.5 left-0.5 px-1 py-px rounded text-[9px] font-medium ${
                        photo.aiVerdict === 'ok'
                          ? 'bg-green-500 text-white'
                          : photo.aiVerdict === 'warning'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {photo.aiVerdict === 'ok' ? 'OK' : photo.aiVerdict === 'warning' ? 'Warning' : 'Issue'}
                    </div>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDelete(photo) }}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 rounded-full text-white touch-manipulation"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {/* Expandable AI analysis text */}
                {isExpanded && photo.aiAnalysis && (
                  <div className="mt-1 p-1.5 bg-gray-50 rounded border text-[10px] text-gray-700 leading-tight">
                    {photo.aiAnalysis}
                  </div>
                )}
              </div>
            )
          }

          return (
            <button
              key={order}
              type="button"
              onClick={() => handleCapture(order)}
              disabled={disabled || uploading}
              className="aspect-[3/2] rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors touch-manipulation disabled:opacity-50"
            >
              {uploading && pendingOrderRef.current === order ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] text-gray-500">Photo {order}</span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
