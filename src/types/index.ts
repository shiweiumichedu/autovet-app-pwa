export interface Category {
  id: string
  name: string
  subdomain: string
}

export type UserStatus = 'current' | 'active' | 'inactive'

export interface UserProfile {
  id: string
  phoneNumber: string
  firstname: string
  lastname: string
  homeAddress: string
  email: string
  pin: string
  access_level: number // 1=Read Only, 2=Limited (default), 3=Standard, 4=Power User, 5=Admin
  status: UserStatus
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PinRequest {
  id: string
  phone_number: string
  status: 'pending' | 'sent' | 'failed'
  tenant: string
  created_at: string
}

// ============================================
// Inspection Workflow Types
// ============================================

export interface Inspection {
  id: string
  userId: string
  categoryId: string
  vehicleYear: number | null
  vehicleMake: string
  vehicleModel: string
  vehicleTrim: string
  vehicleMileage: number | null
  vehicleVin: string
  vehicleColor: string
  status: 'in_progress' | 'completed' | 'passed'
  currentStep: number
  overallRating: number | null
  decision: 'interested' | 'pass' | null
  notes: string
  reportUrl: string | null
  createdAt: Date
  updatedAt: Date
  steps?: InspectionStep[]
  knownIssues?: VehicleKnownIssue[]
  customerReports?: CustomerReport[]
}

export interface InspectionStep {
  id: string
  inspectionId: string
  stepNumber: number
  stepName: string
  status: 'pending' | 'completed' | 'skipped'
  checklist: ChecklistItem[]
  notes: string
  rating: number | null
  photos?: InspectionPhoto[]
}

export interface ChecklistItem {
  item: string
  checked: boolean
  note: string
  rating: number
  weight: number  // 0=Not Important, 1=Important, 2=Very Important
}

export interface ChecklistPreference {
  stepNumber: number
  itemName: string
  weight: 0 | 1 | 2
}

export interface InspectionPhoto {
  id: string
  inspectionId: string
  stepId: string
  photoUrl: string
  photoOrder: number
  aiAnalysis: string | null
  aiVerdict: 'ok' | 'warning' | 'issue' | null
  aiAnalyzedAt: Date | null
}

export type CustomerReportType = 'obd2' | 'carfax' | 'autocheck'

export interface CustomerReport {
  id: string
  inspectionId: string
  reportType: CustomerReportType
  fileUrl: string
  fileName: string
  fileType: string
  aiAnalysis: string | null
  aiVerdict: 'ok' | 'warning' | 'issue' | null
  aiAnalyzedAt: Date | null
  createdAt: Date
}

export interface VehicleKnownIssue {
  id: string
  make: string
  model: string
  yearStart: number
  yearEnd: number
  category: 'safety' | 'engine' | 'transmission' | 'electrical' | 'body' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  source: string
}

export interface InspectionStepTemplate {
  id: string
  stepNumber: number
  stepName: string
  checklistItems: string[]
  instructions: string
  photoRequired: boolean
  maxPhotos: number
}
