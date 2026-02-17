import { createContext } from 'react'

export interface TenantContextType {
  tenant: string | null
  isLoading: boolean
}

export const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true,
})
