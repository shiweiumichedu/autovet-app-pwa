import React, { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 px-4 z-50 flex items-center justify-center space-x-2">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">You are offline</span>
    </div>
  )
}
