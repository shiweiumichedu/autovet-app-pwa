import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUserProfile } from '../hooks/useUserProfile'
import { useTenant } from '../hooks/useTenant'

const knownTenants = ['auto', 'garage', 'house']

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRouteWithProfile: React.FC<ProtectedRouteProps> = ({
  children,
}) => {
  const { isAuthenticated, phoneNumber } = useAuth()
  const { tenant } = useTenant()
  const { profile, loading } = useUserProfile(
    phoneNumber || '',
    tenant || undefined
  )
  const location = useLocation()

  // If not authenticated, redirect to tenant-specific login
  if (!isAuthenticated) {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const pathTenant =
      pathSegments.length > 0 && knownTenants.includes(pathSegments[0])
        ? pathSegments[0]
        : tenant

    const loginPath = pathTenant ? `/${pathTenant}/login` : '/login'
    return <Navigate to={loginPath} replace />
  }

  // If still loading profile, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not on registration page and profile is incomplete, redirect to registration
  const registrationPath = tenant
    ? `/${tenant}/registration`
    : '/registration'

  if (!location.pathname.includes('/registration')) {
    const registrationCompleted = localStorage.getItem(
      `registration-completed-${phoneNumber}`
    )

    if (
      !registrationCompleted &&
      (!profile || !profile.firstname?.trim() || !profile.lastname?.trim())
    ) {
      return <Navigate to={registrationPath} replace />
    }
  }

  return <>{children}</>
}
