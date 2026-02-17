import { useState, useEffect } from 'react'
import { useTenant } from './useTenant'
import { supabase } from '../lib/supabase'

const AUTH_STORAGE_KEY = 'autovet-auth'

interface AuthState {
  isAuthenticated: boolean
  phoneNumber: string | null
  isAdmin: boolean
  accessLevel: number
}

export const useAuth = () => {
  const { tenant } = useTenant()

  const getInitialState = (): AuthState => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading auth state:', error)
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }

    return {
      isAuthenticated: false,
      phoneNumber: null,
      isAdmin: false,
      accessLevel: 2,
    }
  }

  const [authState, setAuthState] = useState<AuthState>(getInitialState)

  useEffect(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState))
  }, [authState])

  const login = async (phoneNumber: string) => {
    try {
      // Get the category ID for the current tenant
      let categoryQuery = supabase
        .from('categories')
        .select('id, name, subdomain')

      if (tenant === 'auto' || tenant === null) {
        categoryQuery = categoryQuery.eq('subdomain', 'auto')
      } else {
        categoryQuery = categoryQuery.eq('subdomain', tenant)
      }

      const { data: categoryData, error: categoryError } = await categoryQuery.single()

      if (categoryError || !categoryData) {
        console.error('Category not found for tenant:', tenant)
        const newAuthState = {
          isAuthenticated: true,
          phoneNumber,
          isAdmin: false,
          accessLevel: 2,
        }
        setAuthState(newAuthState)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuthState))
        return
      }

      // Fetch user's access level from database for the specific category
      const { data: userData, error } = await supabase
        .from('users')
        .select('access_level, phone_number, category_id')
        .eq('phone_number', phoneNumber)
        .eq('category_id', categoryData.id)
        .limit(1)

      if (error) {
        console.error('Error fetching user access level:', error)
        const newAuthState = {
          isAuthenticated: true,
          phoneNumber,
          isAdmin: false,
          accessLevel: 2,
        }
        setAuthState(newAuthState)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuthState))
        return
      }

      const accessLevel = userData && userData.length > 0 ? userData[0].access_level : 2
      const isAdmin = accessLevel === 5

      const newAuthState = {
        isAuthenticated: true,
        phoneNumber,
        isAdmin,
        accessLevel,
      }

      setAuthState(newAuthState)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuthState))
    } catch (error) {
      console.error('Error during login:', error)
      const newAuthState = {
        isAuthenticated: true,
        phoneNumber,
        isAdmin: false,
        accessLevel: 2,
      }
      setAuthState(newAuthState)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuthState))
    }
  }

  const logout = () => {
    const currentPhoneNumber = authState.phoneNumber

    setAuthState({
      isAuthenticated: false,
      phoneNumber: null,
      isAdmin: false,
      accessLevel: 2,
    })
    localStorage.removeItem(AUTH_STORAGE_KEY)

    if (currentPhoneNumber) {
      localStorage.removeItem(`registration-completed-${currentPhoneNumber}`)
    }

    const loginPath = tenant ? `/${tenant}/login` : '/login'
    window.location.href = loginPath
  }

  return {
    isAuthenticated: authState.isAuthenticated,
    phoneNumber: authState.phoneNumber,
    isAdmin: authState.isAdmin,
    accessLevel: authState.accessLevel,
    login,
    logout,
  }
}
