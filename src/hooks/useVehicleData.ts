import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { VehicleKnownIssue, InspectionStepTemplate } from '../types'

export const useVehicleData = () => {
  const [knownIssues, setKnownIssues] = useState<VehicleKnownIssue[]>([])
  const [stepTemplates, setStepTemplates] = useState<InspectionStepTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKnownIssues = useCallback(async (make: string, model: string, year: number) => {
    if (!make || !model || !year) {
      setKnownIssues([])
      return []
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('get_vehicle_known_issues', {
        p_make: make,
        p_model: model,
        p_year: year,
      })

      if (rpcError) throw rpcError

      const issues: VehicleKnownIssue[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        make: row.make as string,
        model: row.model as string,
        yearStart: row.year_start as number,
        yearEnd: row.year_end as number,
        category: row.category as VehicleKnownIssue['category'],
        severity: row.severity as VehicleKnownIssue['severity'],
        title: row.title as string,
        description: row.description as string,
        source: row.source as string,
      }))

      setKnownIssues(issues)
      return issues
    } catch (err) {
      console.error('Error fetching known issues:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch known issues')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStepTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('get_inspection_step_templates')

      if (rpcError) throw rpcError

      const templates: InspectionStepTemplate[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        stepNumber: row.step_number as number,
        stepName: row.step_name as string,
        checklistItems: row.checklist_items as string[],
        instructions: row.instructions as string,
        photoRequired: row.photo_required as boolean,
        maxPhotos: row.max_photos as number,
      }))

      setStepTemplates(templates)
      return templates
    } catch (err) {
      console.error('Error fetching step templates:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch step templates')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    knownIssues,
    stepTemplates,
    loading,
    error,
    fetchKnownIssues,
    fetchStepTemplates,
  }
}
