import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  User,
  Save,
  Mail,
  Home,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useUserProfile } from '../hooks/useUserProfile'
import { useTenant } from '../hooks/useTenant'
import { useAuth } from '../hooks/useAuth'

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
  phoneNumber: string
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  phoneNumber,
}) => {
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const { isAdmin } = useAuth()

  const { profile, loading, error, saveProfile, refreshProfile } =
    useUserProfile(phoneNumber, tenant || undefined)

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    homeAddress: '',
    email: '',
    pin: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isFormInitialized, setIsFormInitialized] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const hasRefreshedOnOpen = useRef(false)

  // Refresh profile when modal opens
  useEffect(() => {
    if (isOpen && phoneNumber && !hasRefreshedOnOpen.current) {
      hasRefreshedOnOpen.current = true
      if (refreshProfile && (!profile || error)) {
        refreshProfile()
      }
    } else if (!isOpen) {
      hasRefreshedOnOpen.current = false
    }
  }, [isOpen, phoneNumber, refreshProfile, profile, error])

  // Update form data when profile loads
  useEffect(() => {
    if (profile && !isFormInitialized) {
      setFormData({
        firstname: profile.firstname || '',
        lastname: profile.lastname || '',
        homeAddress: profile.homeAddress || '',
        email: profile.email || '',
        pin: profile.pin || '000000',
      })
      setIsFormInitialized(true)
    } else if (isOpen && !profile && !isFormInitialized) {
      setFormData({
        firstname: '',
        lastname: '',
        homeAddress: '',
        email: '',
        pin: '000000',
      })
      setIsFormInitialized(true)
    }
  }, [profile, isOpen, isFormInitialized])

  useEffect(() => {
    if (!isOpen) {
      setIsFormInitialized(false)
    }
  }, [isOpen])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setSaveError(null)
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 6) {
      setFormData((prev) => ({ ...prev, pin: value }))
      setSaveError(null)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)

    try {
      await saveProfile({
        ...formData,
        access_level: profile?.access_level || 2,
        active: profile?.active !== false,
      })

      if (tenant) {
        navigate(isAdmin ? `/${tenant}/admin` : `/${tenant}`)
      } else {
        navigate(isAdmin ? '/admin' : '/')
      }

      onClose()
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save profile'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Account Information
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">Error: {error}</p>
              <button
                onClick={() => refreshProfile && refreshProfile()}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Phone Number (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                />
              </div>

              {/* PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Lock className="w-4 h-4 mr-1" />
                  Security PIN
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    name="pin"
                    value={formData.pin}
                    onChange={handlePinChange}
                    maxLength={6}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter 6-digit PIN"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your last name"
                />
              </div>

              {/* Home Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Home className="w-4 h-4 mr-1" />
                  Home Address
                </label>
                <input
                  type="text"
                  name="homeAddress"
                  value={formData.homeAddress}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your home address"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Error */}
              {(error || saveError) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error || saveError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
