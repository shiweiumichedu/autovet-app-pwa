import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../hooks/useTenant'
import { supabase } from '../lib/supabase'
import { UserProfile, UserStatus } from '../types'
import { Users, Search, Filter, Phone, X, UserX, Trash2 } from 'lucide-react'

interface UserListItem extends UserProfile {}

export const AdminUserList: React.FC = () => {
  const navigate = useNavigate()
  const { accessLevel, isAuthenticated, phoneNumber } = useAuth()
  const { tenant } = useTenant()
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'current' | 'active' | 'inactive'>('all')
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

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
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!phoneNumber) {
        throw new Error('No phone number available for current user')
      }

      // Get the current admin user's category_id
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('category_id, firstname, lastname')
        .eq('phone_number', phoneNumber)
        .single()

      if (adminError || !adminUser) {
        throw new Error('Failed to get admin user information')
      }

      // Get all users from the same category as the admin
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('category_id', adminUser.category_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const userList: UserListItem[] = data.map((user: any) => ({
          id: user.id,
          phoneNumber: user.phone_number,
          firstname: user.firstname,
          lastname: user.lastname,
          homeAddress: user.home_address || '',
          email: user.email || '',
          pin: user.pin || '000000',
          access_level: user.access_level || 2,
          status: user.status || 'active',
          active: user.active !== false,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at),
        }))
        setUsers(userList)
      }
    } catch (err) {
      console.error('Error loading users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userPhone: string, newStatus: UserStatus) => {
    try {
      setUpdatingUser(userPhone)

      const { data, error } = await supabase.rpc('update_user_status', {
        p_phone: userPhone,
        p_status: newStatus,
      })

      if (error) throw error

      if (data) {
        setUsers(
          users.map((user) =>
            user.phoneNumber === userPhone
              ? {
                  ...user,
                  status: newStatus,
                  active: newStatus === 'current' || newStatus === 'active',
                }
              : user
          )
        )
      } else {
        throw new Error('Failed to update user status')
      }
    } catch (err) {
      console.error('Error updating user status:', err)
      alert(err instanceof Error ? err.message : 'Failed to update user status')
    } finally {
      setUpdatingUser(null)
    }
  }

  const deleteUserCompletely = async (userId: string, userName: string, userPhone: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${userName} (Phone: ${userPhone})?\n\nThis action cannot be undone and will delete:\n- User account\n- All PIN requests`
    )

    if (!confirmed) return

    const typeConfirm = window.prompt(
      `To confirm deletion of ${userName} (Phone: ${userPhone}), please type "DELETE" (case sensitive):`
    )

    if (typeConfirm !== 'DELETE') {
      alert('Deletion cancelled. You must type "DELETE" exactly to confirm.')
      return
    }

    try {
      const { error } = await supabase.rpc('delete_user_completely', {
        p_user_id: userId,
      })

      if (error) {
        alert(`Failed to delete user: ${error.message}`)
        return
      }

      alert(`${userName} has been permanently deleted.`)
      setUsers(users.filter((user) => user.id !== userId))
      loadUsers()
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Failed to delete user. Please try again.')
    }
  }

  const getAccessLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'Read Only'
      case 2: return 'Limited'
      case 3: return 'Standard'
      case 4: return 'Power User'
      case 5: return 'Admin'
      default: return 'Unknown'
    }
  }

  const getAccessLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-gray-100 text-gray-800'
      case 2: return 'bg-yellow-100 text-yellow-800'
      case 3: return 'bg-blue-100 text-blue-800'
      case 4: return 'bg-purple-100 text-purple-800'
      case 5: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case 'current': return 'Current'
      case 'active': return 'Active'
      case 'inactive': return 'Inactive'
      default: return 'Unknown'
    }
  }

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatusFilter =
      filterStatus === 'all' || user.status === filterStatus

    return matchesSearch && matchesStatusFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserX className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Users</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close User Management"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600">Manage user accounts and their status</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as 'all' | 'current' | 'active' | 'inactive')
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="current">Current</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-6 text-sm text-gray-600">
            <span>Total: {users.length}</span>
            <span>Current: {users.filter((u) => u.status === 'current').length}</span>
            <span>Active: {users.filter((u) => u.status === 'active').length}</span>
            <span>Inactive: {users.filter((u) => u.status === 'inactive').length}</span>
            <span>Filtered: {filteredUsers.length}</span>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Access Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select
                          value={user.status}
                          onChange={(e) =>
                            updateUserStatus(user.phoneNumber, e.target.value as UserStatus)
                          }
                          disabled={updatingUser === user.phoneNumber}
                          className={`px-3 py-1 rounded-md text-sm font-medium border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            updatingUser === user.phoneNumber
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                        >
                          <option value="current">Current</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        {updatingUser === user.phoneNumber && (
                          <div className="inline-block ml-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstname} {user.lastname}
                          </div>
                          {user.pin === '000000' && (
                            <div className="text-xs text-orange-600 mt-1">Using default PIN</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {user.phoneNumber}
                        </div>
                        {user.email && (
                          <div className="text-sm text-gray-500 mt-1">{user.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccessLevelColor(
                            user.access_level
                          )}`}
                        >
                          {getAccessLevelLabel(user.access_level)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            user.status
                          )}`}
                        >
                          {getStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() =>
                            deleteUserCompletely(
                              user.id,
                              `${user.firstname} ${user.lastname}`,
                              user.phoneNumber
                            )
                          }
                          className="inline-flex items-center px-2 py-1 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                          title="Delete User and All Data"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom Cancel Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            title="Cancel and go back"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
