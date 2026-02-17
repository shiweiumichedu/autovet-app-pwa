import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { UserProfile } from '../types'

export const useUserProfile = (phoneNumber: string, tenant?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (phoneNumber) {
      loadProfile()
    } else {
      setLoading(false)
    }
  }, [phoneNumber, tenant])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      if (tenant) {
        // Get category ID first
        const { data: categoryId, error: categoryError } = await supabase.rpc(
          'get_category_id_by_tenant',
          { p_tenant: tenant }
        )

        if (categoryError) throw categoryError
        if (!categoryId) throw new Error(`Category not found for tenant: ${tenant}`)

        // Get user by phone and category
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('phone_number', phoneNumber)
          .eq('category_id', categoryId)
          .limit(1)

        if (error) throw error

        if (data && data.length > 0) {
          setProfile(mapUserRow(data[0]))
        } else {
          setProfile(null)
        }
      } else {
        // Fallback: query by phone only
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('phone_number', phoneNumber)
          .limit(1)

        if (error) throw error

        if (data && data.length > 0) {
          setProfile(mapUserRow(data[0]))
        } else {
          setProfile(null)
        }
      }
    } catch (err) {
      console.error('Error loading user profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (
    profileData: Omit<UserProfile, 'id' | 'phoneNumber' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      setError(null)

      if (tenant) {
        // Use tenant-aware save function
        const { data: userId, error } = await supabase.rpc(
          'save_user_data_with_category',
          {
            p_phone_number: phoneNumber,
            p_tenant: tenant,
            p_name:
              profileData.firstname && profileData.lastname
                ? `${profileData.firstname} ${profileData.lastname}`
                : null,
            p_email: profileData.email || null,
            p_address: profileData.homeAddress || '',
            p_pin: profileData.pin || '000000',
          }
        )

        if (error) throw error

        await loadProfile()
        return userId
      } else {
        // Fallback: use direct save
        const { data: userId, error } = await supabase.rpc('save_user_data', {
          p_phone: phoneNumber,
          p_first: profileData.firstname || '',
          p_last: profileData.lastname || '',
          p_address: profileData.homeAddress || '',
          p_pin: profileData.pin || '000000',
          p_active: profileData.active !== false,
        })

        if (error) throw error

        await loadProfile()
        return userId
      }
    } catch (err) {
      console.error('Error saving user profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to save profile')
      throw err
    }
  }

  return {
    profile,
    loading,
    error,
    saveProfile,
    refreshProfile: loadProfile,
  }
}

// Helper to map database row to UserProfile
function mapUserRow(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    phoneNumber: row.phone_number as string,
    firstname: (row.firstname as string) || '',
    lastname: (row.lastname as string) || '',
    homeAddress: (row.home_address as string) || '',
    email: (row.email as string) || '',
    pin: (row.pin as string) || '000000',
    access_level: (row.access_level as number) || 2,
    status: (row.status as UserProfile['status']) || 'active',
    active: (row.active as boolean) !== false,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}
