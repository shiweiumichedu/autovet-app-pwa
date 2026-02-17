import React, { useState, useEffect } from 'react'
import { TenantContext } from './TenantContext'

const knownTenants = ['auto', 'garage', 'house']
const DEFAULT_TENANT = 'auto'

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tenant, setTenant] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const detectTenant = () => {
      const pathname = window.location.pathname

      // PRIORITY 1: Check if tenant was locked from deep link
      const lockedTenant = localStorage.getItem('lockedTenant')
      if (lockedTenant && knownTenants.includes(lockedTenant)) {
        setTenant(lockedTenant)
        setIsLoading(false)
        return
      }

      // PRIORITY 2: Check URL path for tenant
      const pathSegments = pathname.split('/').filter(Boolean)

      if (pathSegments.length > 0 && knownTenants.includes(pathSegments[0])) {
        // Lock tenant from deep link on first detection
        if (!lockedTenant) {
          localStorage.setItem('lockedTenant', pathSegments[0])
        }

        setTenant(pathSegments[0])
        setIsLoading(false)
        return
      }

      // PRIORITY 3: Default tenant
      setTenant(DEFAULT_TENANT)
      setIsLoading(false)
    }

    detectTenant()

    // Listen for URL changes
    const handleUrlChange = () => {
      detectTenant()
    }

    window.addEventListener('popstate', handleUrlChange)

    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function (...args) {
      originalPushState.apply(history, args)
      setTimeout(handleUrlChange, 0)
    }

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args)
      setTimeout(handleUrlChange, 0)
    }

    return () => {
      window.removeEventListener('popstate', handleUrlChange)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [])

  return (
    <TenantContext.Provider value={{ tenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  )
}
