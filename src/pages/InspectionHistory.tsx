import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, ChevronRight, Loader2, Car, ThumbsUp, ThumbsDown, Clock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../hooks/useTenant'
import { useUserProfile } from '../hooks/useUserProfile'
import { useInspection } from '../hooks/useInspection'
import { supabase } from '../lib/supabase'

export const InspectionHistory: React.FC = () => {
  const { phoneNumber } = useAuth()
  const { tenant } = useTenant()
  const navigate = useNavigate()
  const { profile } = useUserProfile(phoneNumber || '', tenant || undefined)
  const { inspections, loading, loadUserInspections } = useInspection()

  const basePath = tenant ? `/${tenant}` : ''

  useEffect(() => {
    const fetchInspections = async () => {
      if (!profile?.id) return

      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('subdomain', tenant || 'auto')
        .single()

      if (categoryData) {
        await loadUserInspections(profile.id, categoryData.id)
      }
    }

    fetchInspections()
  }, [profile?.id, tenant, loadUserInspections])

  const getStatusBadge = (status: string, decision: string | null) => {
    if (status === 'completed' && decision === 'interested') {
      return (
        <span className="flex items-center space-x-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
          <ThumbsUp className="w-3 h-3" />
          <span>Interested</span>
        </span>
      )
    }
    if (status === 'passed') {
      return (
        <span className="flex items-center space-x-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
          <ThumbsDown className="w-3 h-3" />
          <span>Passed</span>
        </span>
      )
    }
    return (
      <span className="flex items-center space-x-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded-full">
        <Clock className="w-3 h-3" />
        <span>In Progress</span>
      </span>
    )
  }

  const handleInspectionClick = (inspectionId: string, status: string) => {
    if (status === 'in_progress') {
      navigate(`${basePath}/inspect/${inspectionId}`)
    } else {
      navigate(`${basePath}/inspect/${inspectionId}/summary`)
    }
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
          <h1 className="text-lg font-bold text-gray-900">My Inspections</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 py-3 flex-1 w-full">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : inspections.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">No inspections yet.</p>
            <button
              onClick={() => navigate(`${basePath}/inspect`)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
            >
              Start Your First Inspection
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {inspections.map((insp) => (
              <button
                key={insp.id}
                onClick={() => handleInspectionClick(insp.id, insp.status)}
                className="w-full bg-white rounded-lg shadow-sm border p-3 flex items-center justify-between hover:bg-gray-50 transition-colors touch-manipulation text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {insp.vehicleYear} {insp.vehicleMake} {insp.vehicleModel}
                    </h3>
                    {getStatusBadge(insp.status, insp.decision)}
                  </div>
                  <div className="flex items-center space-x-3">
                    {insp.vehicleTrim && (
                      <span className="text-[10px] text-gray-500">{insp.vehicleTrim}</span>
                    )}
                    {insp.vehicleMileage && (
                      <span className="text-[10px] text-gray-500">
                        {insp.vehicleMileage.toLocaleString()} mi
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {new Date(insp.createdAt).toLocaleDateString()}
                    </span>
                    {insp.overallRating && (
                      <div className="flex items-center space-x-0.5">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <Star
                            key={r}
                            className={`w-2.5 h-2.5 ${
                              r <= insp.overallRating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
