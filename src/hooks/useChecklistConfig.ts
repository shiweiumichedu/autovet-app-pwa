import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { ChecklistPreference } from '../types'

export const useChecklistConfig = () => {
  const [preferences, setPreferences] = useState<ChecklistPreference[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPreferences = useCallback(async (userId: string): Promise<ChecklistPreference[]> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('get_user_checklist_preferences', {
        p_user_id: userId,
      })

      if (rpcError) throw rpcError

      const mapped: ChecklistPreference[] = (data || []).map((row: Record<string, unknown>) => ({
        stepNumber: row.step_number as number,
        itemName: row.item_name as string,
        weight: row.weight as 0 | 1 | 2,
      }))

      setPreferences(mapped)
      return mapped
    } catch (err) {
      console.error('Error loading checklist preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to load preferences')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const savePreferences = useCallback(async (
    userId: string,
    prefs: ChecklistPreference[]
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const payload = prefs.map((p) => ({
        step_number: p.stepNumber,
        item_name: p.itemName,
        weight: p.weight,
      }))

      const { error: rpcError } = await supabase.rpc('save_user_checklist_preferences', {
        p_user_id: userId,
        p_preferences: payload,
      })

      if (rpcError) throw rpcError

      setPreferences(prefs)
      return true
    } catch (err) {
      console.error('Error saving checklist preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    preferences,
    loading,
    error,
    loadPreferences,
    savePreferences,
  }
}
