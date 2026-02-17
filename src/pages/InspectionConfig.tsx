import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, Save, Check } from 'lucide-react'
import { useTenant } from '../hooks/useTenant'
import { useAuth } from '../hooks/useAuth'
import { useUserProfile } from '../hooks/useUserProfile'
import { useChecklistConfig } from '../hooks/useChecklistConfig'
import { supabase } from '../lib/supabase'
import { ChecklistPreference, InspectionStepTemplate } from '../types'

interface ConfigItem {
  stepNumber: number
  stepName: string
  itemName: string
  weight: 0 | 1 | 2
}

const MAX_ACTIVE_PER_STEP = 5

const WEIGHT_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  2: { label: 'High', color: 'text-white', bg: 'bg-green-600' },
  1: { label: 'Normal', color: 'text-white', bg: 'bg-blue-600' },
  0: { label: 'Skip', color: 'text-white', bg: 'bg-gray-400' },
}

export const InspectionConfig: React.FC = () => {
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const { phoneNumber } = useAuth()
  const { profile } = useUserProfile(phoneNumber || '', tenant || undefined)
  const { loadPreferences, savePreferences, loading: prefLoading } = useChecklistConfig()

  const userId = profile?.id

  const [items, setItems] = useState<ConfigItem[]>([])
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const basePath = tenant ? `/${tenant}` : ''

  const loadData = useCallback(async () => {
    if (!userId) return

    setLoadingTemplates(true)
    try {
      // Load templates and preferences in parallel
      const [templatesResult, prefs] = await Promise.all([
        supabase.rpc('get_inspection_step_templates'),
        loadPreferences(userId),
      ])

      if (templatesResult.error) throw templatesResult.error

      const rawTemplates = (templatesResult.data || []) as Record<string, unknown>[]
      const templates: InspectionStepTemplate[] = rawTemplates.map((row) => ({
        id: row.id as string,
        stepNumber: row.step_number as number,
        stepName: row.step_name as string,
        checklistItems: row.checklist_items as string[],
        instructions: row.instructions as string,
        photoRequired: row.photo_required as boolean,
        maxPhotos: row.max_photos as number,
      }))

      // Build preference lookup
      const prefMap = new Map<string, 0 | 1 | 2>()
      prefs.forEach((p: ChecklistPreference) => {
        prefMap.set(`${p.stepNumber}:${p.itemName}`, p.weight)
      })

      // Merge templates with preferences
      const configItems: ConfigItem[] = []
      const hasPrefs = prefs.length > 0
      templates.forEach((t) => {
        if (t.stepNumber === 1) return // Skip vehicle info step
        let defaultIdx = 0
        t.checklistItems.forEach((itemName) => {
          const key = `${t.stepNumber}:${itemName}`
          let weight: 0 | 1 | 2
          if (hasPrefs && prefMap.has(key)) {
            weight = prefMap.get(key)!
          } else {
            // Default: first 5 items active, rest skipped
            weight = defaultIdx < MAX_ACTIVE_PER_STEP ? 1 : 0
          }
          defaultIdx++
          configItems.push({
            stepNumber: t.stepNumber,
            stepName: t.stepName,
            itemName,
            weight,
          })
        })
      })

      setItems(configItems)
      // Expand all steps by default
      const stepNumbers = new Set(configItems.map((i) => i.stepNumber))
      setExpandedSteps(stepNumbers)
    } catch (err) {
      console.error('Error loading config data:', err)
    } finally {
      setLoadingTemplates(false)
    }
  }, [userId, loadPreferences])

  useEffect(() => {
    loadData()
  }, [loadData])

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepNumber)) next.delete(stepNumber)
      else next.add(stepNumber)
      return next
    })
  }

  const getActiveCount = (stepNumber: number) =>
    items.filter((i) => i.stepNumber === stepNumber && i.weight > 0).length

  const setWeight = (stepNumber: number, itemName: string, weight: 0 | 1 | 2) => {
    // Block promoting to High/Normal if already at max active
    if (weight > 0) {
      const current = items.find((i) => i.stepNumber === stepNumber && i.itemName === itemName)
      if (current && current.weight === 0 && getActiveCount(stepNumber) >= MAX_ACTIVE_PER_STEP) {
        return // at limit — must Skip something first
      }
    }
    setSaved(false)
    setItems((prev) =>
      prev.map((item) =>
        item.stepNumber === stepNumber && item.itemName === itemName
          ? { ...item, weight }
          : item
      )
    )
  }

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    const prefs: ChecklistPreference[] = items.map((item) => ({
      stepNumber: item.stepNumber,
      itemName: item.itemName,
      weight: item.weight,
    }))
    const success = await savePreferences(userId, prefs)
    setSaving(false)
    if (success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  // Group items by step
  const groupedSteps = items.reduce<Map<number, { stepName: string; items: ConfigItem[] }>>(
    (acc, item) => {
      if (!acc.has(item.stepNumber)) {
        acc.set(item.stepNumber, { stepName: item.stepName, items: [] })
      }
      acc.get(item.stepNumber)!.items.push(item)
      return acc
    },
    new Map()
  )

  if (loadingTemplates) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center">
          <button
            onClick={() => navigate(`${basePath}/dashboard`)}
            className="mr-3 p-1 rounded-lg hover:bg-gray-100 touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Inspection Config</h1>
            <p className="text-[10px] text-gray-500">Customize checklist importance</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 py-3 flex-1 w-full pb-20">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <p className="text-xs text-blue-700">
            Choose up to 5 items per step. High = very important (2x), Normal = important (1x),
            Skip = hidden. To add a new item, Skip one first.
          </p>
        </div>

        {/* Step sections */}
        <div className="space-y-2">
          {Array.from(groupedSteps.entries()).map(([stepNumber, group]) => {
            const isExpanded = expandedSteps.has(stepNumber)
            const activeCount = group.items.filter((i) => i.weight > 0).length
            const atLimit = activeCount >= MAX_ACTIVE_PER_STEP
            return (
              <div key={stepNumber} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Step header */}
                <button
                  onClick={() => toggleStep(stepNumber)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 touch-manipulation"
                >
                  <div className="flex items-center space-x-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-semibold text-gray-900">{group.stepName}</span>
                  </div>
                  <span className={`text-[10px] ${atLimit ? 'text-orange-500 font-medium' : 'text-gray-500'}`}>
                    {activeCount}/{MAX_ACTIVE_PER_STEP}
                  </span>
                </button>

                {/* Items */}
                {isExpanded && (
                  <div className="border-t divide-y">
                    {group.items.map((item) => {
                      const isSkipped = item.weight === 0
                      const locked = isSkipped && atLimit
                      return (
                        <div
                          key={`${item.stepNumber}-${item.itemName}`}
                          className="px-3 py-1 flex items-center justify-between"
                        >
                          <p className={`text-[11px] mr-2 ${isSkipped ? 'text-gray-400' : 'text-gray-900'}`}>{item.itemName}</p>
                          <div className="flex space-x-0.5 flex-shrink-0">
                            {([2, 1, 0] as const).map((w) => {
                              const cfg = WEIGHT_LABELS[w]
                              const isActive = item.weight === w
                              const disabled = w > 0 && locked
                              return (
                                <button
                                  key={w}
                                  onClick={() => setWeight(item.stepNumber, item.itemName, w)}
                                  disabled={disabled}
                                  className={`py-0.5 px-2 rounded text-[9px] font-medium transition-colors touch-manipulation ${
                                    isActive
                                      ? `${cfg.bg} ${cfg.color}`
                                      : disabled
                                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  }`}
                                >
                                  {cfg.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* Floating Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3">
        <button
          onClick={handleSave}
          disabled={saving || prefLoading}
          className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg font-medium transition-colors touch-manipulation disabled:opacity-50 ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saved ? (
            <>
              <Check className="w-5 h-5" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
