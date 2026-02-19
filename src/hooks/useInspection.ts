import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Inspection, InspectionStep, ChecklistItem, VehicleKnownIssue, CustomerReport, CustomerReportType } from '../types'

function mapInspection(data: Record<string, unknown>): Inspection {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    categoryId: data.category_id as string,
    vehicleYear: data.vehicle_year as number | null,
    vehicleMake: data.vehicle_make as string,
    vehicleModel: data.vehicle_model as string,
    vehicleTrim: data.vehicle_trim as string,
    vehicleMileage: data.vehicle_mileage as number | null,
    vehicleVin: data.vehicle_vin as string,
    vehicleColor: data.vehicle_color as string,
    status: data.status as Inspection['status'],
    currentStep: data.current_step as number,
    overallRating: data.overall_rating as number | null,
    decision: data.decision as Inspection['decision'],
    notes: data.notes as string,
    reportUrl: data.report_url as string | null,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
    steps: data.steps
      ? (data.steps as Record<string, unknown>[]).map(mapStep)
      : undefined,
    knownIssues: data.known_issues
      ? (data.known_issues as Record<string, unknown>[]).map((ki) => ({
          id: ki.id as string,
          make: ki.make as string,
          model: ki.model as string,
          yearStart: ki.year_start as number,
          yearEnd: ki.year_end as number,
          category: ki.category as VehicleKnownIssue['category'],
          severity: ki.severity as VehicleKnownIssue['severity'],
          title: ki.title as string,
          description: ki.description as string,
          source: ki.source as string,
        }))
      : undefined,
    customerReports: data.customer_reports
      ? (data.customer_reports as Record<string, unknown>[]).map((cr) => ({
          reportType: cr.report_type as CustomerReportType,
          fileUrl: cr.file_url as string,
          fileName: cr.file_name as string,
          fileType: cr.file_type as string,
          aiSummary: (cr.ai_summary as string) || null,
          aiAnalyzedAt: cr.ai_analyzed_at ? new Date(cr.ai_analyzed_at as string) : null,
          uploadedAt: new Date(cr.uploaded_at as string),
        }))
      : undefined,
  }
}

function parseChecklist(raw: unknown): ChecklistItem[] {
  let items: Record<string, unknown>[] = []
  if (Array.isArray(raw)) items = raw
  else if (typeof raw === 'string') {
    try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) items = parsed } catch { /* empty */ }
  }
  return items.map((c) => ({
    item: (c.item as string) || '',
    checked: !!c.checked,
    note: (c.note as string) || '',
    rating: (c.rating as number) || 0,
    weight: (c.weight as number) ?? 1,
  }))
}

function mapStep(data: Record<string, unknown>): InspectionStep {
  return {
    id: data.id as string,
    inspectionId: data.inspection_id as string,
    stepNumber: data.step_number as number,
    stepName: data.step_name as string,
    status: data.status as InspectionStep['status'],
    checklist: parseChecklist(data.checklist),
    notes: data.notes as string,
    rating: data.rating as number | null,
    photos: data.photos
      ? (data.photos as Record<string, unknown>[]).map((p) => ({
          id: p.id as string,
          inspectionId: p.inspection_id as string,
          stepId: p.step_id as string,
          photoUrl: p.photo_url as string,
          photoOrder: p.photo_order as number,
          aiAnalysis: p.ai_analysis as string | null,
          aiVerdict: p.ai_verdict as 'ok' | 'warning' | 'issue' | null,
          aiAnalyzedAt: p.ai_analyzed_at ? new Date(p.ai_analyzed_at as string) : null,
        }))
      : undefined,
  }
}

export const useInspection = () => {
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createInspection = useCallback(async (params: {
    userId: string
    categoryId: string
    vehicleYear?: number
    vehicleMake: string
    vehicleModel: string
    vehicleTrim?: string
    vehicleMileage?: number
    vehicleVin?: string
    vehicleColor?: string
  }): Promise<string | null> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('create_inspection', {
        p_user_id: params.userId,
        p_category_id: params.categoryId,
        p_vehicle_year: params.vehicleYear || null,
        p_vehicle_make: params.vehicleMake,
        p_vehicle_model: params.vehicleModel,
        p_vehicle_trim: params.vehicleTrim || '',
        p_vehicle_mileage: params.vehicleMileage || null,
        p_vehicle_vin: params.vehicleVin || '',
        p_vehicle_color: params.vehicleColor || '',
      })

      if (rpcError) throw rpcError

      return data as string
    } catch (err) {
      console.error('Error creating inspection:', err)
      const msg = err instanceof Error ? err.message : 'Failed to create inspection'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadInspection = useCallback(async (inspectionId: string): Promise<Inspection | null> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('get_inspection', {
        p_inspection_id: inspectionId,
      })

      if (rpcError) throw rpcError
      if (!data) {
        setInspection(null)
        return null
      }

      const mapped = mapInspection(data as Record<string, unknown>)
      setInspection(mapped)
      return mapped
    } catch (err) {
      console.error('Error loading inspection:', err)
      setError(err instanceof Error ? err.message : 'Failed to load inspection')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const loadUserInspections = useCallback(async (
    userId: string,
    categoryId: string
  ): Promise<Inspection[]> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('get_user_inspections', {
        p_user_id: userId,
        p_category_id: categoryId,
      })

      if (rpcError) throw rpcError

      const mapped = (data || []).map((row: Record<string, unknown>) => mapInspection(row))
      setInspections(mapped)
      return mapped
    } catch (err) {
      console.error('Error loading inspections:', err)
      setError(err instanceof Error ? err.message : 'Failed to load inspections')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const updateStep = useCallback(async (
    stepId: string,
    updates: {
      checklist?: ChecklistItem[]
      notes?: string
      rating?: number
      status?: 'pending' | 'completed' | 'skipped'
    }
  ): Promise<boolean> => {
    try {
      setError(null)

      const { error: rpcError } = await supabase.rpc('update_inspection_step', {
        p_step_id: stepId,
        p_checklist: updates.checklist ?? null,
        p_notes: updates.notes ?? null,
        p_rating: updates.rating ?? null,
        p_status: updates.status ?? null,
      })

      if (rpcError) throw rpcError

      return true
    } catch (err) {
      console.error('Error updating step:', err)
      setError(err instanceof Error ? err.message : 'Failed to update step')
      return false
    }
  }, [])

  const updateCurrentStep = useCallback(async (
    inspectionId: string,
    stepNumber: number
  ): Promise<boolean> => {
    try {
      setError(null)

      const { error: rpcError } = await supabase.rpc('update_inspection_current_step', {
        p_inspection_id: inspectionId,
        p_current_step: stepNumber,
      })

      if (rpcError) throw rpcError

      return true
    } catch (err) {
      console.error('Error updating current step:', err)
      setError(err instanceof Error ? err.message : 'Failed to update current step')
      return false
    }
  }, [])

  const completeInspection = useCallback(async (
    inspectionId: string,
    overallRating: number,
    decision: 'interested' | 'pass',
    notes?: string
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const { error: rpcError } = await supabase.rpc('complete_inspection', {
        p_inspection_id: inspectionId,
        p_overall_rating: overallRating,
        p_decision: decision,
        p_notes: notes || null,
      })

      if (rpcError) throw rpcError

      return true
    } catch (err) {
      console.error('Error completing inspection:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete inspection')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteInspection = useCallback(async (
    inspectionId: string
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('delete_inspection', {
        p_inspection_id: inspectionId,
      })

      if (rpcError) throw rpcError

      // Clean up storage files
      const result = data as { deleted: boolean; photo_paths: { inspection_id: string; step_number: number; photo_order: number }[] }
      if (result.photo_paths?.length > 0) {
        const filePaths = result.photo_paths.map(
          (p) => `${p.inspection_id}/${p.step_number}/${p.photo_order}.jpg`
        )
        await supabase.storage.from('inspection-photos').remove(filePaths)
      }

      // Remove from local state
      setInspections((prev) => prev.filter((i) => i.id !== inspectionId))

      return true
    } catch (err) {
      console.error('Error deleting inspection:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete inspection')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    inspection,
    inspections,
    loading,
    error,
    createInspection,
    loadInspection,
    loadUserInspections,
    updateStep,
    updateCurrentStep,
    completeInspection,
    deleteInspection,
  }
}
