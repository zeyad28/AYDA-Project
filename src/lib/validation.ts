import { z } from 'zod'

// Egyptian mobile numbers: optional +2/002 country prefix, then
// 010 / 011 / 012 / 015 followed by 8 digits.
export const EGYPTIAN_PHONE_REGEX = /^(\+2|002)?01[0125][0-9]{8}$/

export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, '')
}

export const REQUEST_TYPE_VALUES = ['prescription', 'convoy', 'medical', 'consultation'] as const

export const requestFormSchema = z
  .object({
    request_type: z.enum(REQUEST_TYPE_VALUES),
    full_name: z
      .string()
      .trim()
      .min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل')
      .max(100, 'الاسم طويل جداً'),
    phone: z
      .string()
      .trim()
      .refine((v) => EGYPTIAN_PHONE_REGEX.test(normalizePhone(v)), 'اكتب رقم موبايل مصري صحيح (مثال: 01012345678)'),
    age: z.string().trim(),
    city: z.string().trim().max(100, 'اسم البلد طويل جداً'),
    device: z.string().trim().max(120, 'اسم الجهاز طويل جداً'),
    chronic_diseases: z.string().trim().max(500, 'النص طويل جداً'),
    symptoms: z.string().trim().max(2000, 'النص طويل جداً'),
    details: z.string().trim().max(2000, 'النص طويل جداً'),
  })
  .superRefine((data, ctx) => {
    const require = (field: keyof typeof data, message: string) => {
      if (!data[field]) ctx.addIssue({ code: 'custom', path: [field], message })
    }

    if (data.age) {
      const n = Number(data.age)
      if (!Number.isInteger(n) || n < 1 || n > 120) {
        ctx.addIssue({ code: 'custom', path: ['age'], message: 'اكتب سناً صحيحاً بين 1 و 120' })
      }
    }

    switch (data.request_type) {
      case 'prescription':
        require('details', 'اكتب سبب عدم القدرة على صرف الروشتة')
        break
      case 'convoy':
        require('city', 'اكتب اسم البلد')
        require('details', 'اكتب أسباب طلب القافلة')
        break
      case 'medical':
        require('device', 'اختر الجهاز المطلوب')
        require('details', 'اكتب سبب عدم القدرة على شراء الجهاز')
        break
      case 'consultation':
        require('age', 'اكتب السن')
        require('symptoms', 'اكتب الأعراض التي تشكو منها')
        break
    }
  })

export type RequestFormValues = z.infer<typeof requestFormSchema>
