import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  User,
  Phone,
  Calendar,
  MapPin,
  Stethoscope,
  ClipboardList,
  Activity,
  FileText,
  Upload,
  Image as ImageIcon,
  X,
  Pill,
  Truck,
  HeartPulse,
  MessageCircle,
  Check,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { requestFormSchema, normalizePhone } from '../lib/validation'
import type { RequestFormValues } from '../lib/validation'
import { submitRequest, uploadPrescription, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_MB } from '../services/requests'
import { PulseLine } from '../components/PulseLine'

const TABS: { id: RequestFormValues['request_type']; label: string; hint: string; icon: LucideIcon }[] = [
  { id: 'prescription', label: 'صرف روشتة', hint: 'صرف أدوية روشتة لا تقدر على تكلفتها', icon: Pill },
  { id: 'convoy', label: 'طلب قافلة', hint: 'طلب نزول قافلة طبية لقريتك أو منطقتك', icon: Truck },
  { id: 'medical', label: 'أجهزة طبية', hint: 'طلب جهاز طبي لا تقدر على شرائه', icon: HeartPulse },
  { id: 'consultation', label: 'استشارة طبية', hint: 'استشارة مجانية من أطباء الفريق', icon: MessageCircle },
]

const DEVICE_OPTIONS = ['كرسي متحرك', 'جهاز قياس ضغط', 'جهاز قياس سكر']

const EMPTY_VALUES: RequestFormValues = {
  request_type: 'prescription',
  full_name: '',
  phone: '',
  age: '',
  city: '',
  device: '',
  chronic_diseases: '',
  symptoms: '',
  details: '',
}

const inputBase =
  'w-full rounded-xl border border-line bg-white py-3 text-ink placeholder:text-ink/35 transition focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20'
const inputClass = `${inputBase} px-4`
const iconInputClass = `${inputBase} pr-11 pl-4`
const labelClass = 'mb-1.5 block text-sm font-bold text-ink/80'
const errorClass = 'mt-1.5 text-sm font-bold text-red-600'

function FieldIcon({ icon: Icon, top = false }: { icon: LucideIcon; top?: boolean }) {
  return (
    <Icon
      className={`pointer-events-none absolute right-3.5 h-5 w-5 text-ink/30 ${top ? 'top-3.5' : 'top-1/2 -translate-y-1/2'}`}
    />
  )
}

export default function RequestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [showOther, setShowOther] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  const activeTab = watch('request_type')
  const activeTabInfo = TABS.find((t) => t.id === activeTab)

  const switchTab = (tab: RequestFormValues['request_type']) => {
    setValue('request_type', tab)
    setShowOther(false)
    setFile(null)
    setFileError(null)
    clearErrors()
  }

  const handleFileChange = (selected: File | null) => {
    setFileError(null)
    if (selected) {
      if (!ALLOWED_IMAGE_TYPES.includes(selected.type)) {
        setFileError('يُسمح فقط بصور بصيغة JPG أو PNG أو WEBP أو HEIC')
        setFile(null)
        return
      }
      if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setFileError(`حجم الصورة يجب ألا يتجاوز ${MAX_FILE_SIZE_MB} ميجابايت`)
        setFile(null)
        return
      }
    }
    setFile(selected)
  }

  const onSubmit = async (values: RequestFormValues) => {
    try {
      let imagePath: string | null = null
      if (values.request_type === 'prescription' && file) {
        imagePath = await uploadPrescription(file)
      }
      await submitRequest({
        full_name: values.full_name,
        phone: normalizePhone(values.phone),
        request_type: values.request_type,
        age: values.age ? Number(values.age) : null,
        city: values.city || null,
        device: values.device || null,
        chronic_diseases: values.chronic_diseases || null,
        symptoms: values.symptoms || null,
        details: values.details || null,
        image_url: imagePath,
      })
      toast.success('تم إرسال طلبك بنجاح!')
      reset(EMPTY_VALUES)
      setFile(null)
      setSubmitted(true)
    } catch {
      toast.error('حدث خطأ أثناء الإرسال، حاول مرة أخرى')
    }
  }

  const fieldError = (name: keyof RequestFormValues) =>
    errors[name] ? (
      <p className={errorClass} role="alert">
        {errors[name]?.message}
      </p>
    ) : null

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <span className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-brand-fade text-white shadow-glow">
          <Check className="h-8 w-8" strokeWidth={3} />
        </span>
        <h1 className="font-display text-3xl font-bold" role="status">
          تم استلام طلبك
        </h1>
        <p className="mt-3 leading-relaxed text-ink/60">
          فريق AYDA هيراجع الطلب ويتواصل معاك على رقم الموبايل في أقرب وقت
        </p>
        <PulseLine className="mt-8 h-6 w-48 text-teal/50" strokeWidth={2.5} />
        <button
          type="button"
          className="mt-8 rounded-xl bg-teal px-7 py-3.5 font-bold text-white shadow-card transition hover:bg-teal-dark"
          onClick={() => setSubmitted(false)}
        >
          إرسال طلب آخر
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <span className="text-sm font-bold text-coral">نموذج طلب</span>
        <h1 className="mt-1 font-display text-3xl font-bold">مركز طلبات AYDA</h1>
        <p className="mt-2 text-ink/60">اختر نوع الطلب واملأ البيانات، وفريقنا هيتواصل معاك في أقرب وقت</p>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="نوع الطلب">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchTab(tab.id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl px-3 py-3.5 text-sm font-bold transition ${
                active ? 'bg-brand-fade text-white shadow-glow' : 'bg-white text-ink/60 shadow-card hover:text-ink'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2.25} />
              {tab.label}
            </button>
          )
        })}
      </div>
      {activeTabInfo && <p className="mb-6 text-center text-sm text-ink/50">{activeTabInfo.hint}</p>}

      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="h-1.5 bg-brand-fade" aria-hidden="true" />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6 sm:p-8" noValidate>
          <div>
            <label className={labelClass} htmlFor="full_name">
              الاسم بالكامل
            </label>
            <div className="relative">
              <input id="full_name" type="text" className={iconInputClass} {...register('full_name')} />
              <FieldIcon icon={User} />
            </div>
            {fieldError('full_name')}
          </div>

          <div>
            <label className={labelClass} htmlFor="phone">
              رقم التليفون للتواصل
            </label>
            <div className="relative">
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                placeholder="01012345678"
                className={`${iconInputClass} text-right`}
                {...register('phone')}
              />
              <FieldIcon icon={Phone} />
            </div>
            {fieldError('phone')}
          </div>

          {activeTab === 'prescription' && (
            <>
              <div>
                <label className={labelClass} htmlFor="age">
                  السن <span className="font-normal text-ink/40">(اختياري)</span>
                </label>
                <div className="relative">
                  <input id="age" type="number" inputMode="numeric" className={iconInputClass} {...register('age')} />
                  <FieldIcon icon={Calendar} />
                </div>
                {fieldError('age')}
              </div>

              <div>
                <label className={labelClass} htmlFor="details">
                  سبب عدم القدرة على الصرف
                </label>
                <div className="relative">
                  <textarea id="details" rows={3} className={`${iconInputClass} pt-3`} {...register('details')} />
                  <FieldIcon icon={FileText} top />
                </div>
                {fieldError('details')}
              </div>

              <div>
                <label className={labelClass} htmlFor="prescription-file">
                  صورة الروشتة <span className="font-normal text-ink/40">(اختياري)</span>
                </label>
                {file ? (
                  <div className="flex items-center justify-between rounded-xl border border-teal/30 bg-teal-soft px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-bold text-teal-dark">
                      <ImageIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFileChange(null)}
                      aria-label="إزالة الصورة"
                      className="rounded-lg p-1 text-ink/40 transition hover:bg-white hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="prescription-file"
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-teal/30 bg-teal-soft/40 px-4 py-6 text-center transition hover:border-teal/50 hover:bg-teal-soft/60"
                  >
                    <Upload className="h-6 w-6 text-teal" />
                    <span className="text-sm font-bold text-ink/70">اضغط لرفع صورة الروشتة</span>
                    <span className="text-xs text-ink/40">JPG, PNG, WEBP أو HEIC - حتى {MAX_FILE_SIZE_MB} ميجابايت</span>
                  </label>
                )}
                <input
                  id="prescription-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
                {fileError && (
                  <p className={errorClass} role="alert">
                    {fileError}
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === 'convoy' && (
            <>
              <div>
                <label className={labelClass} htmlFor="city">
                  اسم البلد
                </label>
                <div className="relative">
                  <input id="city" type="text" className={iconInputClass} {...register('city')} />
                  <FieldIcon icon={MapPin} />
                </div>
                {fieldError('city')}
              </div>

              <div>
                <label className={labelClass} htmlFor="details">
                  أسباب نزول القافلة
                </label>
                <div className="relative">
                  <textarea id="details" rows={3} className={`${iconInputClass} pt-3`} {...register('details')} />
                  <FieldIcon icon={FileText} top />
                </div>
                {fieldError('details')}
              </div>
            </>
          )}

          {activeTab === 'medical' && (
            <>
              <div>
                <label className={labelClass} htmlFor="device">
                  الجهاز المطلوب
                </label>
                <div className="relative">
                  <select
                    id="device"
                    className={iconInputClass}
                    value={showOther ? 'other' : watch('device')}
                    onChange={(e) => {
                      const isOther = e.target.value === 'other'
                      setShowOther(isOther)
                      setValue('device', isOther ? '' : e.target.value, { shouldValidate: false })
                    }}
                  >
                    <option value="">اختر الجهاز المطلوب...</option>
                    {DEVICE_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                    <option value="other">أخرى</option>
                  </select>
                  <FieldIcon icon={Stethoscope} />
                </div>
                {showOther && (
                  <input
                    type="text"
                    placeholder="اكتب اسم الجهاز..."
                    className={`${inputClass} mt-2`}
                    {...register('device')}
                  />
                )}
                {fieldError('device')}
              </div>

              <div>
                <label className={labelClass} htmlFor="details">
                  أسباب عدم القدرة على الشراء
                </label>
                <div className="relative">
                  <textarea id="details" rows={3} className={`${iconInputClass} pt-3`} {...register('details')} />
                  <FieldIcon icon={FileText} top />
                </div>
                {fieldError('details')}
              </div>
            </>
          )}

          {activeTab === 'consultation' && (
            <>
              <div>
                <label className={labelClass} htmlFor="age">
                  السن
                </label>
                <div className="relative">
                  <input id="age" type="number" inputMode="numeric" className={iconInputClass} {...register('age')} />
                  <FieldIcon icon={Calendar} />
                </div>
                {fieldError('age')}
              </div>

              <div>
                <label className={labelClass} htmlFor="chronic_diseases">
                  الأمراض المزمنة <span className="font-normal text-ink/40">(إن وجدت)</span>
                </label>
                <div className="relative">
                  <input id="chronic_diseases" type="text" className={iconInputClass} {...register('chronic_diseases')} />
                  <FieldIcon icon={ClipboardList} />
                </div>
                {fieldError('chronic_diseases')}
              </div>

              <div>
                <label className={labelClass} htmlFor="symptoms">
                  الأعراض التي تشكو منها بالتفصيل
                </label>
                <div className="relative">
                  <textarea id="symptoms" rows={4} className={`${iconInputClass} pt-3`} {...register('symptoms')} />
                  <FieldIcon icon={Activity} top />
                </div>
                {fieldError('symptoms')}
              </div>
            </>
          )}

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full rounded-xl bg-brand-fade py-4 text-lg font-bold text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
          </button>
        </form>
      </div>
    </div>
  )
}
