// Shared domain types mirroring the Supabase schema (supabase/schema.sql).

// 'tools' exists only on legacy rows; new requests use 'medical'.
export type RequestType = 'prescription' | 'convoy' | 'medical' | 'consultation' | 'tools'

export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface Committee {
  id: string
  code: string
  name: string
  description: string | null
  head_name: string | null
  image_url: string | null
  created_at: string
}

export interface MedicalRequest {
  id: string
  full_name: string
  phone: string
  request_type: RequestType
  age: number | null
  city: string | null
  device: string | null
  chronic_diseases: string | null
  symptoms: string | null
  details: string | null
  image_url: string | null
  status: RequestStatus
  created_at: string
}

export type NewMedicalRequest = Omit<MedicalRequest, 'id' | 'created_at' | 'status'>
