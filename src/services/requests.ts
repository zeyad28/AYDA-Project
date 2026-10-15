import { supabase } from '../lib/supabaseClient'
import type { MedicalRequest, NewMedicalRequest, RequestStatus, RequestType } from '../types'

const BUCKET = 'prescriptions'

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]
export const MAX_FILE_SIZE_MB = 5

// The bucket is private; files are written with unguessable UUID names and
// read back only through admin-signed URLs (see signPrescriptionUrls).
export async function uploadPrescription(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('يُسمح فقط بصور بصيغة JPG أو PNG أو WEBP أو HEIC')
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`حجم الصورة يجب ألا يتجاوز ${MAX_FILE_SIZE_MB} ميجابايت`)
  }
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const name = `${crypto.randomUUID()}.${ext}`
  const { data, error } = await supabase.storage.from(BUCKET).upload(name, file)
  if (error) throw error
  return data.path
}

export async function submitRequest(request: NewMedicalRequest): Promise<void> {
  // RLS only allows public inserts with status 'pending'.
  const { error } = await supabase.from('requests').insert([{ ...request, status: 'pending' }])
  if (error) throw error
}

export interface RequestFilters {
  status?: RequestStatus
  type?: RequestType
  search?: string
  page?: number
  pageSize?: number
}

export interface RequestPage {
  rows: MedicalRequest[]
  count: number
}

export async function fetchRequests(filters: RequestFilters = {}): Promise<RequestPage> {
  const page = filters.page ?? 0
  const pageSize = filters.pageSize ?? 20

  let query = supabase
    .from('requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.type) {
    // Legacy rows may still carry 'tools' from before the 'medical' rename.
    query = filters.type === 'medical'
      ? query.in('request_type', ['medical', 'tools'])
      : query.eq('request_type', filters.type)
  }
  if (filters.search) {
    const term = filters.search.replace(/[,()%]/g, ' ').trim()
    if (term) query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { rows: data ?? [], count: count ?? 0 }
}

export interface RequestCounts {
  total: number
  pending: number
  approved: number
  rejected: number
}

// head: true skips returning rows, so each count is a cheap COUNT(*) query.
export async function fetchRequestCounts(): Promise<RequestCounts> {
  const base = () => supabase.from('requests').select('*', { count: 'exact', head: true })
  const [total, pending, approved, rejected] = await Promise.all([
    base(),
    base().eq('status', 'pending'),
    base().eq('status', 'approved'),
    base().eq('status', 'rejected'),
  ])
  for (const r of [total, pending, approved, rejected]) if (r.error) throw r.error
  return {
    total: total.count ?? 0,
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
  }
}

export async function fetchAllRequestsForExport(): Promise<MedicalRequest[]> {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function updateRequestStatus(id: string, status: RequestStatus): Promise<void> {
  const { error } = await supabase.from('requests').update({ status }).eq('id', id)
  if (error) throw error
}

// Creating signed URLs requires SELECT permission on the objects, which the
// storage RLS grants to admins only.
export async function signPrescriptionUrls(
  rows: Pick<MedicalRequest, 'image_url'>[],
  expiresInSeconds: number
): Promise<Record<string, string>> {
  const paths = rows.map((r) => r.image_url).filter((p): p is string => Boolean(p))
  if (!paths.length) return {}
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, expiresInSeconds)
  if (error) throw error
  const map: Record<string, string> = {}
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl
  }
  return map
}
