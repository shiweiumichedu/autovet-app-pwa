import React, { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Users, Shield, ArrowLeft, User, LogOut, MessageSquare } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../hooks/useTenant'
import { AccountModal } from '../components/AccountModal'
import { supabase } from '../lib/supabase'

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { phoneNumber, isAdmin, logout } = useAuth()
  const { tenant } = useTenant()
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [stats, setStats] = useState({ total: 0, current: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)

  // Authorization check
  if (!isAdmin) {
    const redirectPath = tenant ? `/${tenant}` : '/'
    return <Navigate to={redirectPath} replace />
  }

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      if (!phoneNumber) return

      // Get admin user's category_id
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('category_id')
        .eq('phone_number', phoneNumber)
        .single()

      if (adminError || !adminUser) return

      // Get all users in the same category
      const { data: users, error } = await supabase
        .from('users')
        .select('status')
        .eq('category_id', adminUser.category_id)

      if (error || !users) return

      setStats({
        total: users.length,
        current: users.filter(u => u.status === 'current').length,
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const adminPath = tenant ? `/${tenant}/admin` : '/admin'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(tenant ? `/${tenant}` : '/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-600" />
                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAccountModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Account"
              >
                <User className="w-5 h-5" />
              </button>
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.total}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-gray-500">Current</p>
            <p className="text-2xl font-bold text-green-600">
              {loading ? '...' : stats.current}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-blue-600">
              {loading ? '...' : stats.active}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-red-600">
              {loading ? '...' : stats.inactive}
            </p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Management */}
          <button
            onClick={() => navigate(`${adminPath}/users`)}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md hover:border-blue-300 transition-all text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                <p className="text-gray-600 mt-1">
                  View, search, and manage user accounts. Change user status and access levels.
                </p>
              </div>
            </div>
          </button>

          {/* PIN Requests */}
          <button
            onClick={() => navigate(`${adminPath}/pin-requests`)}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md hover:border-blue-300 transition-all text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 rounded-full p-3">
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">PIN Requests</h2>
                <p className="text-gray-600 mt-1">
                  Review and process pending PIN requests from the login screen.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Account Modal */}
      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        phoneNumber={phoneNumber || ''}
      />
    </div>
  )
}
