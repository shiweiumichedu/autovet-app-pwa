import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Shield, LogIn } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../hooks/useTenant'
import { supabase } from '../lib/supabase'

export const LoginForm: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { tenant } = useTenant()

  // Load saved phone number from localStorage
  const [phoneNumber, setPhoneNumber] = useState(() => {
    const saved = localStorage.getItem('rememberedPhoneNumber')
    return saved || ''
  })
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [pinRequestSent, setPinRequestSent] = useState(false)

  // Save phone number to localStorage when it's a full 10-digit number
  useEffect(() => {
    if (phoneNumber.replace(/\D/g, '').length === 10) {
      localStorage.setItem('rememberedPhoneNumber', phoneNumber)
    }
  }, [phoneNumber])

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '')

    if (digits.length < 3) return digits

    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    }
    return digits
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const currentDigits = phoneNumber.replace(/\D/g, '')
    const newDigits = inputValue.replace(/\D/g, '')

    if (newDigits.length < currentDigits.length) {
      setPhoneNumber(formatPhoneNumber(newDigits))
    } else {
      const limitedDigits = newDigits.slice(0, 10)
      setPhoneNumber(formatPhoneNumber(limitedDigits))
    }
    setError('')
  }

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const cursorPosition =
        (e.target as HTMLInputElement).selectionStart || 0
      const currentValue = phoneNumber

      if (cursorPosition > 0) {
        const charAtCursor = currentValue[cursorPosition - 1]
        if (' ()- '.includes(charAtCursor)) {
          e.preventDefault()
          const digits = currentValue.replace(/\D/g, '')
          if (digits.length > 0) {
            setPhoneNumber(formatPhoneNumber(digits.slice(0, -1)))
          }
        }
      }
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(value)
    setError('')
  }

  const handleContinueWithPin = () => {
    const digits = phoneNumber.replace(/\D/g, '')
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }
    setError('')
    setCodeSent(true)
  }

  const handleLogin = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a 6-digit PIN')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const unformattedPhone = phoneNumber.replace(/\D/g, '')

      // Verify user can access this tenant and get their PIN
      const { data, error } = await supabase.rpc('verify_user_category_access', {
        p_phone: unformattedPhone,
        p_tenant: tenant || '',
      })

      if (error) {
        console.error('Database error:', error)
        setError('Authentication error. Please try again.')
        setIsLoading(false)
        return
      }

      const verificationResult = data?.[0]
      if (!verificationResult) {
        setError('User not found. Please check your phone number.')
        setIsLoading(false)
        return
      }

      if (!verificationResult.can_access) {
        setError(
          verificationResult.error_message || 'Access denied for this login page.'
        )
        setIsLoading(false)
        return
      }

      // Get stored PIN and handle 4-to-6-digit migration
      let storedPin = verificationResult.pin || '000000'
      if (storedPin === '0000') {
        storedPin = '000000'
      } else if (storedPin.length === 4 && storedPin !== '0000') {
        storedPin = '00' + storedPin
      }

      if (code !== storedPin) {
        setError('Invalid PIN. Please try again.')
        setIsLoading(false)
        return
      }

      await login(unformattedPhone)

      const dashboardPath = tenant ? `/${tenant}/dashboard` : '/dashboard'
      setTimeout(() => {
        navigate(dashboardPath, { replace: true })
      }, 100)
    } catch (err) {
      console.error('Login error:', err)
      setError('Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestPin = async () => {
    const digits = phoneNumber.replace(/\D/g, '')
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    try {
      const { error } = await supabase.rpc('create_pin_request', {
        p_phone: digits,
        p_tenant: tenant || '',
      })

      if (error) {
        console.error('PIN request error:', error)
        setError('Failed to submit PIN request. Please try again.')
        return
      }

      setPinRequestSent(true)
    } catch (err) {
      console.error('PIN request error:', err)
      setError('Failed to submit PIN request. Please try again.')
    }
  }

  const handleGuestLogin = async () => {
    const startDate = new Date('2025-01-01T00:00:00.000Z')
    const now = new Date()
    const secondsSinceStart = Math.floor(
      (now.getTime() - startDate.getTime()) / 1000
    )
    const guestPhone = secondsSinceStart.toString().padStart(10, '0')

    await login(guestPhone)

    const registrationPath = tenant
      ? `/${tenant}/registration`
      : '/registration'
    setTimeout(() => {
      navigate(registrationPath, { replace: true })
    }, 100)
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action()
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative bg-gradient-to-br from-gray-800 to-gray-900"
    >
      {/* Content container */}
      <div className="relative z-10 max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AutoVet</h1>
          <p className="text-gray-300">
            Sign in to access your dashboard
          </p>
          {tenant && tenant !== 'auto' && (
            <span className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-full capitalize">
              {tenant}
            </span>
          )}
        </div>

        {/* Login Form */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-2xl p-8">
          <div className="space-y-6">
            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  onKeyDown={handlePhoneKeyDown}
                  onKeyPress={(e) => handleKeyPress(e, handleContinueWithPin)}
                  placeholder="(555) 123-4567"
                  disabled={codeSent}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="mt-3">
                <button
                  onClick={handleContinueWithPin}
                  disabled={
                    isLoading ||
                    codeSent ||
                    phoneNumber.replace(/\D/g, '').length !== 10
                  }
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <span>Continue with PIN</span>
                  )}
                </button>
              </div>
            </div>

            {/* PIN Input */}
            {codeSent && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security PIN
                </label>
                <div className="flex space-x-3">
                  <div className="relative flex-1">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={code}
                      onChange={handleCodeChange}
                      onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                      placeholder="Enter PIN"
                      maxLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                    />
                  </div>
                  <button
                    onClick={handleLogin}
                    disabled={code.length !== 6}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">
                    Enter your 6-digit security PIN
                  </p>
                  <button
                    onClick={() => {
                      setCodeSent(false)
                      setCode('')
                      setError('')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {codeSent && !error && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-600">
                  Enter your 6-digit security PIN to access your account.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-3">
          <button
            onClick={handleGuestLogin}
            className="text-blue-300 hover:text-white underline text-sm transition-colors duration-200 block mx-auto"
          >
            Continue as Guest
          </button>
          <button
            onClick={handleRequestPin}
            disabled={phoneNumber.replace(/\D/g, '').length !== 10 || pinRequestSent}
            className="text-blue-300 hover:text-white underline text-sm transition-colors duration-200 block mx-auto disabled:text-gray-500 disabled:no-underline disabled:cursor-not-allowed"
          >
            {pinRequestSent ? 'PIN request sent. An admin will contact you.' : 'Request a PIN'}
          </button>
        </div>
      </div>
    </div>
  )
}
