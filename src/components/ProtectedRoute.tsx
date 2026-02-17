import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../hooks/useTenant'

const knownTenants = ['auto', 'garage', 'house']

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const { tenant } = useTenant()

  if (!isAuthenticated) {
    const pathSegments = window.location.pathname.split('/').filter(Boolean)
    const pathTenant =
      pathSegments.length > 0 && knownTenants.includes(pathSegments[0])
        ? pathSegments[0]
        : tenant

    const loginPath = pathTenant ? `/${pathTenant}/login` : '/login'
    return <Navigate to={loginPath} replace />
  }

  return <>{children}</>
}
