import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../hooks/useTenant'
import { LoginForm } from '../components/LoginForm'

export const Login: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { tenant } = useTenant()

  if (isAuthenticated) {
    const knownTenants = ['auto', 'garage', 'house']
    const pathSegments = window.location.pathname.split('/').filter(Boolean)
    const pathTenant =
      pathSegments.length > 0 && knownTenants.includes(pathSegments[0])
        ? pathSegments[0]
        : tenant

    const dashboardPath = pathTenant ? `/${pathTenant}` : '/'
    return <Navigate to={dashboardPath} replace />
  }

  return <LoginForm />
}
