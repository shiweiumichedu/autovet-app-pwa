import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Loader2, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../hooks/useTenant'
import { useUserProfile } from '../hooks/useUserProfile'
import { useInspection } from '../hooks/useInspection'
import { useVehicleData } from '../hooks/useVehicleData'
import { KnownIssueCard } from '../components/KnownIssueCard'
import { supabase } from '../lib/supabase'

export const InspectionStart: React.FC = () => {
  const { phoneNumber } = useAuth()
  const { tenant } = useTenant()
  const navigate = useNavigate()
  const { profile } = useUserProfile(phoneNumber || '', tenant || undefined)
  const { createInspection, loading: creating } = useInspection()
  const { knownIssues, loading: loadingIssues, fetchKnownIssues } = useVehicleData()

  const [vehicleYear, setVehicleYear] = useState('2009')
  const [vehicleMake, setVehicleMake] = useState('Mini')
  const [vehicleModel, setVehicleModel] = useState('Clubman')
  const [vehicleTrim, setVehicleTrim] = useState('Base')
  const [vehicleMileage, setVehicleMileage] = useState('820000')
  const [vehicleVin, setVehicleVin] = useState('')
  const [vehicleColor, setVehicleColor] = useState('Blue')
  const [issuesSearched, setIssuesSearched] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const basePath = tenant ? `/${tenant}` : ''

  // Auto-search known issues when year/make/model are filled
  useEffect(() => {
    const year = parseInt(vehicleYear)
    if (vehicleMake && vehicleModel && year >= 1980 && year <= 2030) {
      const timer = setTimeout(() => {
        fetchKnownIssues(vehicleMake, vehicleModel, year)
        setIssuesSearched(true)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setIssuesSearched(false)
    }
  }, [vehicleYear, vehicleMake, vehicleModel, fetchKnownIssues])

  const handleSearchIssues = async () => {
    const year = parseInt(vehicleYear)
    if (vehicleMake && vehicleModel && year) {
      await fetchKnownIssues(vehicleMake, vehicleModel, year)
      setIssuesSearched(true)
    }
  }

  const handleStartInspection = async () => {
    setErrorMsg('')

    if (!profile?.id) {
      setErrorMsg('User profile not loaded. Please go back and try again.')
      return
    }
    if (!vehicleMake || !vehicleModel) {
      setErrorMsg('Make and Model are required.')
      return
    }

    try {
      const { data: categoryData, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('subdomain', tenant || 'auto')
        .single()

      if (catError || !categoryData) {
        setErrorMsg(`Category lookup failed: ${catError?.message || 'Not found'}`)
        return
      }

      const inspectionId = await createInspection({
        userId: profile.id,
        categoryId: categoryData.id,
        vehicleYear: vehicleYear ? parseInt(vehicleYear) : undefined,
        vehicleMake,
        vehicleModel,
        vehicleTrim,
        vehicleMileage: vehicleMileage ? parseInt(vehicleMileage) : undefined,
        vehicleVin,
        vehicleColor,
      })

      if (inspectionId) {
        navigate(`${basePath}/inspect/${inspectionId}`)
      } else {
        setErrorMsg('Failed to create inspection. Make sure the database migration (add_inspection_tables.sql) has been run.')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.')
    }
  }

  const canStart = vehicleMake.trim() && vehicleModel.trim()

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
          <h1 className="text-lg font-bold text-gray-900">New Inspection</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 py-3 flex-1 w-full">
        {/* Vehicle Info Form */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Vehicle Information</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Year</label>
              <input
                type="number"
                value={vehicleYear}
                onChange={(e) => setVehicleYear(e.target.value)}
                placeholder="2020"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Make *</label>
              <input
                type="text"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
                placeholder="Toyota"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Model *</label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Camry"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Trim</label>
              <input
                type="text"
                value={vehicleTrim}
                onChange={(e) => setVehicleTrim(e.target.value)}
                placeholder="SE, XLE, etc."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Mileage</label>
              <input
                type="number"
                value={vehicleMileage}
                onChange={(e) => setVehicleMileage(e.target.value)}
                placeholder="45000"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Color</label>
              <input
                type="text"
                value={vehicleColor}
                onChange={(e) => setVehicleColor(e.target.value)}
                placeholder="Silver"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-gray-600 mb-1">VIN (optional)</label>
            <input
              type="text"
              value={vehicleVin}
              onChange={(e) => setVehicleVin(e.target.value.toUpperCase())}
              placeholder="1HGBH41JXMN109186"
              maxLength={17}
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* Known Issues Section */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Known Issues</h2>
            <button
              type="button"
              onClick={handleSearchIssues}
              disabled={!vehicleMake || !vehicleModel || !vehicleYear || loadingIssues}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 touch-manipulation"
            >
              {loadingIssues ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Search className="w-3 h-3" />
              )}
              <span>Search</span>
            </button>
          </div>

          {!issuesSearched ? (
            <p className="text-xs text-gray-500 text-center py-4">
              Enter year, make, and model to search for known issues.
            </p>
          ) : knownIssues.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              No known issues found for this vehicle.
            </p>
          ) : (
            <div className="space-y-2">
              {knownIssues.map((issue) => (
                <KnownIssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <p className="text-xs text-red-700">{errorMsg}</p>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStartInspection}
          disabled={!canStart || creating}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          {creating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Start Inspection</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </main>
    </div>
  )
}
