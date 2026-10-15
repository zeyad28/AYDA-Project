import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Mail, Lock, Search, ClipboardList, Clock, CheckCircle2, XCircle, LogOut, Download } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSession } from '../hooks/useSession'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { checkIsAdmin, signInAdmin, signOutAdmin } from '../services/auth'
import {
  fetchAllRequestsForExport,
  fetchRequestCounts,
  fetchRequests,
  signPrescriptionUrls,
  updateRequestStatus,
} from '../services/requests'
import type { RequestStatus, RequestType } from '../types'

const PAGE_SIZE = 20

const REQUEST_TYPE_LABELS: Record<string, string> = {
  prescription: 'روشتة',
  convoy: 'قافلة',
  medical: 'أجهزة طبية',
  tools: 'أجهزة طبية',
  consultation: 'استشارة',
}

const TYPE_FILTER_OPTIONS: { value: RequestType | 'all'; label: string }[] = [
  { value: 'all', label: 'كل الأنواع' },
  { value: 'prescription', label: 'روشتة' },
  { value: 'convoy', label: 'قافلة' },
  { value: 'medical', label: 'أجهزة طبية' },
  { value: 'consultation', label: 'استشارة' },
]

const STATUS_LABELS: Record<RequestStatus, { text: string; badge: string }> = {
  pending: { text: 'قيد الانتظار', badge: 'bg-amber-soft text-amber' },
  approved: { text: 'مقبول', badge: 'bg-teal-soft text-teal-dark' },
  rejected: { text: 'مرفوض', badge: 'bg-red-50 text-red-700' },
}

const STATUS_FILTERS: { value: RequestStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'approved', label: 'مقبول' },
  { value: 'rejected', label: 'مرفوض' },
]

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoggingIn(true)
    try {
      await signInAdmin(email, password)
      toast.success('تم تسجيل الدخول بنجاح')
      // No manual redirect needed: useSession's onAuthStateChange listener
      // updates the session and this component unmounts in favor of the
      // dashboard automatically.
    } catch {
      toast.error('بيانات الدخول غير صحيحة')
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-coral/10 blur-3xl" aria-hidden="true" />

      <form onSubmit={handleLogin} className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="h-1.5 bg-brand-fade" aria-hidden="true" />
        <div className="p-8">
          <h1 className="mb-6 text-center font-display text-2xl font-bold text-ink">دخول لوحة التحكم</h1>

          <label className="mb-1.5 block text-sm font-bold text-ink/80" htmlFor="admin-email">
            البريد الإلكتروني
          </label>
          <div className="relative mb-4">
            <input
              id="admin-email"
              required
              type="email"
              className="w-full rounded-xl border border-line bg-white py-3 pl-4 pr-11 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Mail className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/30" />
          </div>

          <label className="mb-1.5 block text-sm font-bold text-ink/80" htmlFor="admin-password">
            كلمة المرور
          </label>
          <div className="relative mb-6">
            <input
              id="admin-password"
              required
              type="password"
              className="w-full rounded-xl border border-line bg-white py-3 pl-4 pr-11 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Lock className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/30" />
          </div>

          <button
            disabled={loggingIn}
            className="w-full rounded-xl bg-brand-fade py-3.5 font-bold text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingIn ? 'جاري الدخول...' : 'دخول'}
          </button>
        </div>
      </form>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
  badge,
  icon: Icon,
}: {
  label: string
  value: number
  accent: string
  badge: string
  icon: LucideIcon
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${badge}`}>
        <Icon className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <div>
        <p className="text-sm font-bold text-ink/50">{label}</p>
        <p className={`font-display text-2xl font-bold ${accent}`}>{value}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { session, loading: sessionLoading } = useSession()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<RequestType | 'all'>('all')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)
  const debouncedSearch = useDebouncedValue(searchInput, 350)

  // Reset to page 0 whenever a filter changes, right in the handler that
  // changes it - simpler and avoids an extra render vs. a reset effect.
  const updateStatusFilter = (value: RequestStatus | 'all') => {
    setStatusFilter(value)
    setPage(0)
  }
  const updateTypeFilter = (value: RequestType | 'all') => {
    setTypeFilter(value)
    setPage(0)
  }
  const updateSearch = (value: string) => {
    setSearchInput(value)
    setPage(0)
  }

  // Server-side enforcement lives in RLS; this check only powers a helpful
  // warning when the account is not in the admins allow-list.
  const { data: isAdmin } = useQuery({
    queryKey: ['is_admin'],
    queryFn: checkIsAdmin,
    enabled: !!session,
  })

  const { data: counts } = useQuery({
    queryKey: ['request_counts'],
    queryFn: fetchRequestCounts,
    enabled: !!session,
  })

  const {
    data: requestsPage,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['requests', { statusFilter, typeFilter, search: debouncedSearch, page }],
    queryFn: async () => {
      const result = await fetchRequests({
        status: statusFilter === 'all' ? undefined : statusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
        search: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      const imageUrls = await signPrescriptionUrls(result.rows, 60 * 60)
      return { ...result, imageUrls }
    },
    enabled: !!session,
    placeholderData: (previous) => previous,
  })

  const requests = requestsPage?.rows ?? []
  const imageUrls = requestsPage?.imageUrls ?? {}
  const totalCount = requestsPage?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RequestStatus }) => updateRequestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.invalidateQueries({ queryKey: ['request_counts'] })
      toast.success('تم تحديث حالة الطلب')
    },
    onError: () => toast.error('تعذر تحديث حالة الطلب'),
  })

  const handleReject = (id: string) => {
    if (window.confirm('هل أنت متأكد من رفض هذا الطلب؟')) {
      statusMutation.mutate({ id, status: 'rejected' })
    }
  }

  const exportToCSV = async () => {
    try {
      const allRequests = await fetchAllRequestsForExport()
      // CSV files get opened later/offline, so sign with a 7-day expiry
      // instead of the 1-hour URLs used on screen.
      const csvUrls = await signPrescriptionUrls(allRequests, 60 * 60 * 24 * 7)
      const headers = ['الاسم', 'الهاتف', 'نوع الطلب', 'السن', 'المدينة', 'الجهاز', 'الأمراض المزمنة', 'الأعراض', 'التفاصيل', 'الحالة', 'رابط الروشتة']
      const rows = allRequests.map((req) => {
        const imgUrl = req.image_url ? csvUrls[req.image_url] || '' : ''
        return [
          `"${req.full_name || ''}"`,
          `"${req.phone || ''}"`,
          `"${REQUEST_TYPE_LABELS[req.request_type] || req.request_type}"`,
          `"${req.age ?? ''}"`,
          `"${req.city || ''}"`,
          `"${req.device || ''}"`,
          `"${req.chronic_diseases || ''}"`,
          `"${req.symptoms || ''}"`,
          `"${req.details || ''}"`,
          `"${STATUS_LABELS[req.status]?.text || req.status}"`,
          imgUrl ? `"=HYPERLINK(""${imgUrl}""; ""عرض الصورة"")"` : '""',
        ]
      })

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
      // UTF-8 BOM so Excel opens the Arabic text correctly.
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', 'AYDA_Requests.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('تعذر تصدير الملف، حاول مرة أخرى')
    }
  }

  if (sessionLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <p className="font-bold text-ink/40">جاري التحميل...</p>
      </div>
    )
  }

  if (!session) {
    return <LoginScreen />
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">لوحة تحكم الطلبات</h1>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-teal-dark"
          >
            <Download className="h-4 w-4" />
            تصدير CSV
          </button>
          <button
            onClick={() => signOutAdmin()}
            className="flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-bold text-ink/60 transition hover:border-red-300 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>
      </div>

      {isAdmin === false && (
        <div className="mb-6 rounded-xl border border-amber/40 bg-amber-soft p-4 font-bold text-amber" role="alert">
          حسابك غير مسجل ضمن المشرفين، لذلك لن تظهر لك أي طلبات. راجع ملف supabase/README.md لإضافة حسابك.
        </div>
      )}

      {isError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-700" role="alert">
          تعذر تحميل الطلبات، حاول تحديث الصفحة
        </div>
      )}

      {/* Summary */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="إجمالي الطلبات"
          value={counts?.total ?? 0}
          accent="text-ink"
          badge="bg-sand-deep text-ink/60"
          icon={ClipboardList}
        />
        <StatCard
          label="قيد الانتظار"
          value={counts?.pending ?? 0}
          accent="text-amber"
          badge="bg-amber-soft text-amber"
          icon={Clock}
        />
        <StatCard
          label="مقبول"
          value={counts?.approved ?? 0}
          accent="text-teal-dark"
          badge="bg-teal-soft text-teal-dark"
          icon={CheckCircle2}
        />
        <StatCard
          label="مرفوض"
          value={counts?.rejected ?? 0}
          accent="text-red-600"
          badge="bg-red-50 text-red-600"
          icon={XCircle}
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="search">
          البحث بالاسم أو الهاتف
        </label>
        <div className="relative flex-1">
          <input
            id="search"
            type="search"
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-4 pr-11 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            value={searchInput}
            onChange={(e) => updateSearch(e.target.value)}
          />
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
        </div>

        <label className="sr-only" htmlFor="type-filter">
          نوع الطلب
        </label>
        <select
          id="type-filter"
          className="rounded-xl border border-line bg-white px-4 py-2.5 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
          value={typeFilter}
          onChange={(e) => updateTypeFilter(e.target.value as RequestType | 'all')}
        >
          {TYPE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex gap-1 rounded-xl bg-sand-deep p-1" role="tablist" aria-label="تصفية حسب الحالة">
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={statusFilter === opt.value}
              onClick={() => updateStatusFilter(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                statusFilter === opt.value ? 'bg-white text-ink shadow-card' : 'text-ink/50 hover:text-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="py-12 text-center font-bold text-ink/40">جاري تحميل الطلبات...</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-card md:block">
            <table className="min-w-full text-right">
              <thead className="bg-sand-deep">
                <tr>
                  <th className="p-4 text-sm font-bold text-ink/60">الاسم</th>
                  <th className="p-4 text-sm font-bold text-ink/60">الهاتف</th>
                  <th className="p-4 text-sm font-bold text-ink/60">النوع</th>
                  <th className="p-4 text-sm font-bold text-ink/60">بيانات المريض</th>
                  <th className="p-4 text-sm font-bold text-ink/60">الحالة</th>
                  <th className="p-4 text-sm font-bold text-ink/60">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-t border-line hover:bg-sand/60">
                    <td className="p-4 font-bold">{req.full_name}</td>
                    <td className="p-4" dir="ltr">{req.phone}</td>
                    <td className="p-4">{REQUEST_TYPE_LABELS[req.request_type] || req.request_type}</td>
                    <td className="max-w-xs p-4 text-xs text-ink/60">
                      {req.city && <p>المدينة: {req.city}</p>}
                      {req.device && <p>الجهاز: {req.device}</p>}
                      {req.chronic_diseases && <p>أمراض: {req.chronic_diseases}</p>}
                      {req.symptoms && <p>أعراض: {req.symptoms}</p>}
                      {req.image_url && imageUrls[req.image_url] && (
                        <a href={imageUrls[req.image_url]} target="_blank" rel="noreferrer" className="font-bold text-teal underline">
                          عرض الروشتة
                        </a>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_LABELS[req.status]?.badge}`}>
                        {STATUS_LABELS[req.status]?.text}
                      </span>
                    </td>
                    <td className="space-x-2 space-x-reverse p-4">
                      <button
                        onClick={() => statusMutation.mutate({ id: req.id, status: 'approved' })}
                        disabled={statusMutation.isPending || req.status === 'approved'}
                        className="ml-3 font-bold text-teal-dark disabled:opacity-30"
                      >
                        قبول
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={statusMutation.isPending || req.status === 'rejected'}
                        className="font-bold text-red-600 disabled:opacity-30"
                      >
                        رفض
                      </button>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && !isError && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center font-bold text-ink/30">
                      لا توجد طلبات مطابقة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {requests.map((req) => (
              <div key={req.id} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{req.full_name}</p>
                    <p className="text-sm text-ink/50" dir="ltr">{req.phone}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_LABELS[req.status]?.badge}`}>
                    {STATUS_LABELS[req.status]?.text}
                  </span>
                </div>
                <p className="mb-2 text-sm font-bold text-ink/70">{REQUEST_TYPE_LABELS[req.request_type] || req.request_type}</p>
                <div className="mb-3 space-y-0.5 text-xs text-ink/60">
                  {req.city && <p>المدينة: {req.city}</p>}
                  {req.device && <p>الجهاز: {req.device}</p>}
                  {req.chronic_diseases && <p>أمراض: {req.chronic_diseases}</p>}
                  {req.symptoms && <p>أعراض: {req.symptoms}</p>}
                  {req.details && <p>التفاصيل: {req.details}</p>}
                  {req.image_url && imageUrls[req.image_url] && (
                    <a href={imageUrls[req.image_url]} target="_blank" rel="noreferrer" className="block font-bold text-teal underline">
                      عرض الروشتة
                    </a>
                  )}
                </div>
                <div className="flex gap-2 border-t border-line pt-3">
                  <button
                    onClick={() => statusMutation.mutate({ id: req.id, status: 'approved' })}
                    disabled={statusMutation.isPending || req.status === 'approved'}
                    className="flex-1 rounded-xl bg-teal-soft py-2 text-sm font-bold text-teal-dark disabled:opacity-30"
                  >
                    قبول
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={statusMutation.isPending || req.status === 'rejected'}
                    className="flex-1 rounded-xl bg-red-50 py-2 text-sm font-bold text-red-700 disabled:opacity-30"
                  >
                    رفض
                  </button>
                </div>
              </div>
            ))}
            {requests.length === 0 && !isError && (
              <p className="py-12 text-center font-bold text-ink/30">لا توجد طلبات مطابقة</p>
            )}
          </div>

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm">
              <p className="text-ink/50">
                عرض {page * PAGE_SIZE + 1}-{Math.min(totalCount, (page + 1) * PAGE_SIZE)} من {totalCount}
                {isFetching && ' · جاري التحديث...'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-xl border border-line px-4 py-2 font-bold text-ink/60 transition hover:border-teal hover:text-teal disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink/60"
                >
                  السابق
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={page >= pageCount - 1}
                  className="rounded-xl border border-line px-4 py-2 font-bold text-ink/60 transition hover:border-teal hover:text-teal disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink/60"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
