import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { InspectionPhoto } from '../types'

export const usePhotoUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzePhoto = useCallback(async (
    photoId: string,
    photoUrl: string,
    stepName: string,
    vehicleInfo?: { year?: number | null; make?: string; model?: string; trim?: string }
  ): Promise<{ analysis: string; verdict: string } | null> => {
    try {
      setAnalyzing(true)

      const response = await fetch('/.netlify/functions/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl, stepName, vehicleInfo }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        console.error('AI analysis failed:', errData)
        return null
      }

      const { analysis, verdict } = await response.json()

      // Save analysis to DB via RPC
      await supabase.rpc('save_photo_analysis', {
        p_photo_id: photoId,
        p_ai_analysis: analysis,
        p_ai_verdict: verdict,
      })

      return { analysis, verdict }
    } catch (err) {
      console.error('Error analyzing photo:', err)
      return null
    } finally {
      setAnalyzing(false)
    }
  }, [])

  const uploadPhoto = useCallback(async (
    file: File,
    inspectionId: string,
    stepId: string,
    stepNumber: number,
    photoOrder: number
  ): Promise<InspectionPhoto | null> => {
    try {
      setUploading(true)
      setError(null)

      const filePath = `${inspectionId}/${stepNumber}/${photoOrder}.jpg`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('inspection-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(filePath)

      const photoUrl = urlData.publicUrl

      // Insert photo record into DB via RPC
      const { data, error: insertError } = await supabase.rpc('save_inspection_photo', {
        p_inspection_id: inspectionId,
        p_step_id: stepId,
        p_photo_url: photoUrl,
        p_photo_order: photoOrder,
      })

      if (insertError) throw insertError

      return {
        id: (data as Record<string, unknown>).id as string,
        inspectionId,
        stepId,
        photoUrl,
        photoOrder,
        aiAnalysis: null,
        aiVerdict: null,
        aiAnalyzedAt: null,
      }
    } catch (err) {
      console.error('Error uploading photo:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  const deletePhoto = useCallback(async (
    photoId: string,
    inspectionId: string,
    stepNumber: number,
    photoOrder: number
  ): Promise<boolean> => {
    try {
      setError(null)

      const filePath = `${inspectionId}/${stepNumber}/${photoOrder}.jpg`

      // Delete from storage
      await supabase.storage
        .from('inspection-photos')
        .remove([filePath])

      // Delete from DB
      const { error: deleteError } = await supabase
        .from('inspection_photos')
        .delete()
        .eq('id', photoId)

      if (deleteError) throw deleteError

      return true
    } catch (err) {
      console.error('Error deleting photo:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete photo')
      return false
    }
  }, [])

  return {
    uploading,
    analyzing,
    error,
    uploadPhoto,
    deletePhoto,
    analyzePhoto,
  }
}
