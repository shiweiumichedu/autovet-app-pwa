import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../hooks/useTenant'
import { supabase } from '../lib/supabase'
import { PinRequest } from '../types'
import { ArrowLeft, Send, UserX, Phone, MessageSquare, RefreshCw, Trash2 } from 'lucide-react'

export const AdminPinRequests: React.FC = () => {
  const navigate = useNavigate()
  const { accessLevel, isAuthenticated } = useAuth()
  const { tenant } = useTenant()
  const [pinRequests, setPinRequests] = useState<PinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingPins, setSendingPins] = useState<{ [key: string]: string }>({})
  const [sendingStatus, setSendingStatus] = useState<{ [key: string]: boolean }>({})
  const [deleting, setDeleting] = useState<string | null>(null)

  // Check if user has admin access
  if (!isAuthenticated || accessLevel < 5) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserX className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    loadPinRequests()
  }, [tenant])

  const loadPinRequests = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.rpc('get_pending_pin_requests', {
        p_tenant: tenant || null,
      })

      if (error) throw error

      setPinRequests(data || [])
    } catch (err) {
      console.error('Error loading PIN requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to load PIN requests')
    } finally {
      setLoading(false)
    }
  }

  const handlePinCodeChange = (phoneNumber: string, code: string) => {
    const cleanCode = code.replace(/\D/g, '').slice(0, 6)
    setSendingPins((prev) => ({
      ...prev,
      [phoneNumber]: cleanCode,
    }))
  }

  const handleSendPIN = async (phoneNumber: string) => {
    const pinCode = sendingPins[phoneNumber]

    if (!pinCode || pinCode.length !== 6) {
      alert('Please enter a valid 6-digit PIN code')
      return
    }

    try {
      setSendingStatus((prev) => ({ ...prev, [phoneNumber]: true }))

      const companyName = 'AutoVet'
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '')
      const formattedPhoneNumber =
        cleanPhoneNumber.length === 10 ? `+1${cleanPhoneNumber}` : cleanPhoneNumber

      const message = `Your PIN for ${companyName} is: ${pinCode}. Use this to log in to your account.`
      const smsUrl = `sms:${formattedPhoneNumber}&body=${encodeURIComponent(message)}`

      const cleanPhone = phoneNumber.replace(/\D/g, '')

      // Check if user exists
      const { data: existingUser, error: userError } = await supabase.rpc('get_user_by_phone', {
        p_phone: cleanPhone,
      })

      if (userError) {
        console.error('Error checking for existing user:', userError)
      }

      if (existingUser && existingUser.length > 0) {
        // User exists - update their PIN
        const { error: updateError } = await supabase.rpc('update_user_pin', {
          p_phone: cleanPhone,
          p_new_pin: pinCode,
        })

        if (updateError) {
          alert(`Failed to update user PIN: ${updateError.message}`)
          return
        }
        alert(`PIN updated successfully for existing user ${formatPhoneNumber(cleanPhone)}`)
      } else {
        // User doesn't exist - create new account
        const { error: createError } = await supabase.rpc('save_user_data_with_category', {
          p_phone_number: cleanPhone,
          p_tenant: tenant || '',
          p_name: '',
          p_email: '',
          p_address: '',
          p_pin: pinCode,
        })

        if (createError) {
          alert(`Failed to create user account: ${createError.message}`)
          return
        }
        alert(`New user account created successfully for ${formatPhoneNumber(cleanPhone)}`)
      }

      // Open SMS app
      window.location.href = smsUrl

      // Update the PIN request status to sent
      const pinRequest = pinRequests.find((req) => req.phone_number === phoneNumber)
      if (pinRequest) {
        await supabase.rpc('update_pin_request_status', {
          p_request_id: pinRequest.id,
          p_status: 'sent',
          p_error_message: null,
        })
      }

      // Remove from the list
      setPinRequests((prev) => prev.filter((req) => req.phone_number !== phoneNumber))

      // Clear the PIN code input
      setSendingPins((prev) => {
        const newState = { ...prev }
        delete newState[phoneNumber]
        return newState
      })
    } catch (err) {
      console.error('Error sending PIN:', err)
      alert('Failed to send PIN. Please try again.')
    } finally {
      setSendingStatus((prev) => ({ ...prev, [phoneNumber]: false }))
    }
  }

  const deletePinRequest = async (requestId: string) => {
    if (deleting === requestId) return

    if (!confirm('Are you sure you want to delete this PIN request? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(requestId)
      setError(null)

      const requestExists = pinRequests.find((req) => req.id === requestId)
      if (!requestExists) {
        setDeleting(null)
        return
      }

      const { error: deleteError } = await supabase.rpc('update_pin_request_status', {
        p_request_id: requestId,
        p_status: 'failed',
        p_error_message: 'Deleted by admin',
      })

      if (deleteError) {
        setError(`Failed to delete PIN request: ${deleteError.message}`)
        return
      }

      setPinRequests((prev) => prev.filter((request) => request.id !== requestId))
    } catch (err) {
      console.error('Error in deletePinRequest:', err)
      setError('Failed to delete PIN request')
    } finally {
      setDeleting(null)
    }
  }

  const formatPhoneNumber = (phone: string) => {
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
    }
    return phone
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate(tenant ? `/${tenant}/admin` : '/admin')}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                PIN Request Management
              </h1>
            </div>
            <button
              onClick={loadPinRequests}
              className="px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              title="Refresh PIN requests"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading PIN requests...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        ) : pinRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending PIN Requests</h3>
            <p className="text-gray-600">All PIN requests have been processed.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-3 sm:px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Pending PIN Requests ({pinRequests.length})
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Send PINs to users who have requested them via the login screen.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PIN
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Send
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Del
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Requested At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pinRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm font-medium text-gray-900">
                            {formatPhoneNumber(request.phone_number)}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={sendingPins[request.phone_number] || ''}
                          onChange={(e) =>
                            handlePinCodeChange(request.phone_number, e.target.value)
                          }
                          placeholder="000000"
                          maxLength={6}
                          className="w-16 sm:w-24 px-2 py-2 border border-gray-300 rounded-md text-center font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSendPIN(request.phone_number)}
                          disabled={
                            !sendingPins[request.phone_number] ||
                            sendingPins[request.phone_number].length !== 6 ||
                            sendingStatus[request.phone_number]
                          }
                          className="inline-flex items-center px-2 sm:px-3 py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {sendingStatus[request.phone_number] ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Send className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Send</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => deletePinRequest(request.id)}
                          disabled={deleting === request.id}
                          className="text-red-600 hover:text-red-800 disabled:text-red-300 transition-colors duration-200 p-1 sm:p-2 hover:bg-red-50 rounded"
                          title="Delete PIN request"
                        >
                          {deleting === request.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                        {formatDate(request.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Back Button */}
      <div className="fixed bottom-6 left-6">
        <button
          onClick={() => navigate(tenant ? `/${tenant}/admin` : '/admin')}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
          title="Back to Admin Dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
      </div>
    </div>
  )
}
