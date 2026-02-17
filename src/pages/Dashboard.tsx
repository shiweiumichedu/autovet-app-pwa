import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../hooks/useTenant'
import { useUserProfile } from '../hooks/useUserProfile'
import { AccountModal } from '../components/AccountModal'
import { useNavigate } from 'react-router-dom'
import { User, Car, Home, Wrench, Shield, RefreshCw, X, ClipboardCheck, History, Settings } from 'lucide-react'

const tenantConfig: Record<string, { label: string; icon: React.ReactNode; iconSm: React.ReactNode; description: string }> = {
  auto: {
    label: 'Auto Inspection',
    icon: <Car className="w-8 h-8" />,
    iconSm: <Car className="w-6 h-6" />,
    description: 'Vehicle pre-purchase inspection and vetting',
  },
  garage: {
    label: 'Garage Inspection',
    icon: <Wrench className="w-8 h-8" />,
    iconSm: <Wrench className="w-6 h-6" />,
    description: 'Garage and mechanic shop inspection',
  },
  house: {
    label: 'House Inspection',
    icon: <Home className="w-8 h-8" />,
    iconSm: <Home className="w-6 h-6" />,
    description: 'Property and house inspection',
  },
}

export const Dashboard: React.FC = () => {
  const { phoneNumber, logout, isAdmin, accessLevel } = useAuth()
  const { tenant } = useTenant()
  const navigate = useNavigate()
  const { profile, refreshProfile, loading } = useUserProfile(phoneNumber || '', tenant || undefined)
  const [showAccountModal, setShowAccountModal] = useState(false)

  const config = tenantConfig[tenant || 'auto'] || tenantConfig.auto

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-gray-900">AutoVet</h1>
            {tenant && tenant !== 'auto' && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                {tenant}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">{phoneNumber}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 py-3 flex-1 w-full">
        {/* Welcome section */}
        <div className="bg-white rounded-lg shadow-sm border p-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 rounded-full p-2 text-blue-600">
              {config.iconSm}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Welcome{profile?.firstname ? `, ${profile.firstname}` : ''}!
              </h2>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>
          </div>
        </div>

        {/* Info cards - always horizontal */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white rounded-lg shadow-sm border p-2">
            <p className="text-xs text-gray-500">Tenant</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">{tenant || 'auto'}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-2">
            <p className="text-xs text-gray-500">Access</p>
            <p className="text-sm font-semibold text-gray-900">
              {isAdmin ? 'Admin' : `Level ${accessLevel}`}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-2">
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-sm font-semibold text-green-600">Active</p>
          </div>
        </div>

        {/* Inspection Workflow Actions */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => navigate(tenant ? `/${tenant}/inspect` : '/inspect')}
            className="bg-blue-600 text-white rounded-lg shadow-sm p-4 flex flex-col items-center justify-center hover:bg-blue-700 transition-colors touch-manipulation min-h-[100px]"
          >
            <ClipboardCheck className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Start Inspection</span>
            <span className="text-[10px] opacity-80 mt-0.5">New vehicle check</span>
          </button>
          <button
            onClick={() => navigate(tenant ? `/${tenant}/inspections` : '/inspections')}
            className="bg-white text-gray-900 rounded-lg shadow-sm border p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors touch-manipulation min-h-[100px]"
          >
            <History className="w-8 h-8 mb-2 text-gray-600" />
            <span className="text-sm font-medium">My Inspections</span>
            <span className="text-[10px] text-gray-500 mt-0.5">View past results</span>
          </button>
        </div>

        {/* Bottom Action Bar */}
        <div className="text-center">
          <div className="flex space-x-2 justify-center">
            <button
              onClick={() => setShowAccountModal(true)}
              className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex flex-col items-center justify-center min-h-[48px] min-w-[48px] touch-manipulation"
              title="Account settings"
            >
              <User size={20} className="mb-1" />
              <span className="text-[10px]">Account</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate(tenant ? `/${tenant}/admin` : '/admin')}
                className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex flex-col items-center justify-center min-h-[48px] min-w-[48px] touch-manipulation"
                title="Admin Panel"
              >
                <Shield size={20} className="mb-1" />
                <span className="text-[10px]">Admin</span>
              </button>
            )}
            <button
              onClick={() => navigate(tenant ? `/${tenant}/config` : '/config')}
              className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex flex-col items-center justify-center min-h-[48px] min-w-[48px] touch-manipulation"
              title="Inspection Config"
            >
              <Settings size={20} className="mb-1" />
              <span className="text-[10px]">Config</span>
            </button>
            <button
              onClick={() => refreshProfile()}
              disabled={loading}
              className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex flex-col items-center justify-center min-h-[48px] min-w-[48px] touch-manipulation disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw size={20} className={`mb-1 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-[10px]">Refresh</span>
            </button>
            <button
              onClick={() => logout()}
              className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex flex-col items-center justify-center min-h-[48px] min-w-[48px] touch-manipulation"
              title="Exit"
            >
              <X size={20} className="mb-1" />
              <span className="text-[10px]">Exit</span>
            </button>
          </div>
        </div>
      </main>

      {/* Account Modal */}
      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        phoneNumber={phoneNumber || ''}
      />
    </div>
  )
}
