import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { InspectionPhoto } from '../types'

export const usePhotoUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    error,
    uploadPhoto,
    deletePhoto,
  }
}
