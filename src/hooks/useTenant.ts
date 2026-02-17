import { useContext } from 'react'
import { TenantContext } from '../contexts/TenantContext'

export const useTenant = () => useContext(TenantContext)
