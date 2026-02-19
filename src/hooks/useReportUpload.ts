import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { CustomerReportType } from '../types'

export const useReportUpload = () => {
  const [uploading, setUploading] = useState<CustomerReportType | null>(null)
  const [analyzing, setAnalyzing] = useState<CustomerReportType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadReport = useCallback(async (
    file: File,
    inspectionId: string,
    reportType: CustomerReportType
  ): Promise<{ fileUrl: string; fileName: string; fileType: string } | null> => {
    try {
      setUploading(reportType)
      setError(null)

      const ext = file.name.split('.').pop() || 'pdf'
      const filePath = `${inspectionId}/reports/${reportType}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('inspection-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(filePath)

      const fileUrl = urlData.publicUrl

      await supabase.rpc('save_customer_report', {
        p_inspection_id: inspectionId,
        p_report_type: reportType,
        p_file_url: fileUrl,
        p_file_name: file.name,
        p_file_type: file.type,
      })

      return { fileUrl, fileName: file.name, fileType: file.type }
    } catch (err) {
      console.error('Error uploading report:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload report')
      return null
    } finally {
      setUploading(null)
    }
  }, [])

  const analyzeReport = useCallback(async (
    fileUrl: string,
    reportType: CustomerReportType,
    fileType: string,
    inspectionId: string,
    vehicleInfo?: { year?: number | null; make?: string; model?: string; trim?: string }
  ): Promise<{ summary: string } | null> => {
    try {
      setAnalyzing(reportType)

      const response = await fetch('/.netlify/functions/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, reportType, fileType, vehicleInfo }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        console.error('Report analysis failed:', errData)
        return null
      }

      const { summary } = await response.json()

      await supabase.rpc('save_customer_report_analysis', {
        p_inspection_id: inspectionId,
        p_report_type: reportType,
        p_ai_summary: summary,
      })

      return { summary }
    } catch (err) {
      console.error('Error analyzing report:', err)
      return null
    } finally {
      setAnalyzing(null)
    }
  }, [])

  const deleteReport = useCallback(async (
    inspectionId: string,
    reportType: CustomerReportType
  ): Promise<boolean> => {
    try {
      setError(null)

      // List files matching the report type prefix to find the actual extension
      const { data: files } = await supabase.storage
        .from('inspection-photos')
        .list(`${inspectionId}/reports`, { search: reportType })

      if (files && files.length > 0) {
        const paths = files
          .filter((f) => f.name.startsWith(reportType))
          .map((f) => `${inspectionId}/reports/${f.name}`)
        if (paths.length > 0) {
          await supabase.storage.from('inspection-photos').remove(paths)
        }
      }

      await supabase.rpc('delete_customer_report', {
        p_inspection_id: inspectionId,
        p_report_type: reportType,
      })

      return true
    } catch (err) {
      console.error('Error deleting report:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete report')
      return false
    }
  }, [])

  return {
    uploading,
    analyzing,
    error,
    uploadReport,
    analyzeReport,
    deleteReport,
  }
}
