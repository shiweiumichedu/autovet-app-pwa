import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUserProfile } from '../hooks/useUserProfile'
import { useTenant } from '../hooks/useTenant'
import { User, Lock, Eye, EyeOff } from 'lucide-react'

export const Registration: React.FC = () => {
  const navigate = useNavigate()
  const { phoneNumber, logout } = useAuth()
  const { tenant } = useTenant()

  const { profile, saveProfile, loading, error } = useUserProfile(
    phoneNumber || '',
    tenant || undefined
  )
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    pin: '',
  })
  const [showPin, setShowPin] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Timeout for loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoadingTimeout(true)
      }
    }, 10000)
    return () => clearTimeout(timer)
  }, [loading])

  // Initialize form data from profile
  useEffect(() => {
    if (profile && !loading) {
      setFormData({
        firstname: profile.firstname || '',
        lastname: profile.lastname || '',
        pin: profile.pin || '000000',
      })
    }
  }, [profile, loading])

  // If profile is complete, redirect to dashboard
  useEffect(() => {
    if (
      !loading &&
      profile &&
      profile.firstname.trim() &&
      profile.lastname.trim() &&
      profile.pin !== '000000'
    ) {
      if (tenant) {
        navigate(`/${tenant}/dashboard`, { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [loading, profile, navigate, tenant])

  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading && loadingTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <User className="text-red-600 w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Issue</h2>
            <p className="text-gray-600 mb-4">
              Profile loading is taking longer than expected. You can continue with registration.
            </p>
            <button
              onClick={() => setLoadingTimeout(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Registration
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setFormData((prev) => ({ ...prev, pin: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstname.trim() || !formData.lastname.trim()) {
      alert('Please enter both first name and last name')
      return
    }

    setIsSubmitting(true)

    try {
      const pinToSave = formData.pin.trim() || '000000'

      await saveProfile({
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        homeAddress: '',
        email: '',
        pin: pinToSave,
        access_level: profile?.access_level || 2,
        active: profile?.active !== false,
      })

      if (phoneNumber) {
        localStorage.setItem(`registration-completed-${phoneNumber}`, 'true')
      }

      if (tenant) {
        navigate(`/${tenant}/dashboard`, { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      alert(`Failed to save your information: ${errorMessage}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    logout()
    if (tenant && tenant !== 'auto') {
      navigate(`/${tenant}/login`, { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <User className="text-blue-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {profile?.firstname ? 'Security Update' : 'Welcome!'}
          </h1>
          <p className="text-gray-600">
            {profile?.firstname
              ? 'Please update your security PIN to continue'
              : 'Please complete your profile to continue'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formData.firstname}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your first name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              id="lastname"
              name="lastname"
              value={formData.lastname}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your last name"
              disabled={isSubmitting}
            />
          </div>

          {/* PIN field */}
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Lock className="w-4 h-4 mr-1" />
              Security PIN {profile?.pin === '000000' ? '(Recommended)' : '(Optional)'}
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                id="pin"
                name="pin"
                value={formData.pin}
                onChange={handlePinChange}
                maxLength={6}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter 6-digit PIN"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {profile?.pin === '000000'
                ? 'Default PIN is 000000. Change it for security.'
                : 'Your current PIN is displayed. Modify it to change your PIN.'}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {isSubmitting || loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </form>

        {phoneNumber && !phoneNumber.startsWith('00') && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">Phone: {phoneNumber}</p>
          </div>
        )}
      </div>
    </div>
  )
}
