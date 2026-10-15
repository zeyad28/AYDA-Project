# AYDA - رابطة أطباء المستقبل

منصة الطلبات الطبية لرابطة AYDA (Association of Young Doctors): صفحة عامة تعرض
لجان الرابطة، نموذج لطلب المساعدة الطبية (صرف روشتة، قافلة طبية، أجهزة طبية،
استشارة)، ولوحة تحكم للأدمن لمراجعة الطلبات.

React 18 + TypeScript + Vite + Tailwind CSS + Supabase.

## البدء السريع

1. ثبّت الحزم:

   ```bash
   npm install
   ```

2. أنشئ ملف `.env` بناءً على [.env.example](.env.example):

   ```env
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

   القيم موجودة في: Supabase Dashboard → Project Settings → API.

3. جهّز قاعدة البيانات - راجع [supabase/README.md](supabase/README.md)
   (مشروع جديد يستخدم `supabase/schema.sql`، مشروع قائم يحتاج تشغيل الـ
   migration الموجود في `supabase/migrations/`).

4. شغّل المشروع محلياً:

   ```bash
   npm run dev
   ```

## الأوامر المتاحة

- `npm run dev` - تشغيل خادم التطوير مع Hot Reload
- `npm run build` - فحص الأنواع (`tsc`) ثم بناء نسخة الإنتاج
- `npm run typecheck` - فحص الأنواع فقط بدون بناء
- `npm run lint` - فحص الكود بـ ESLint
- `npm run preview` - معاينة نسخة الإنتاج محلياً بعد `build`

## هيكل المشروع

```
.
├── src/
│   ├── components/
│   │   └── Navbar.tsx           # شريط التنقل العلوي
│   ├── hooks/
│   │   ├── useSession.ts        # حالة تسجيل الدخول (Supabase Auth)
│   │   └── useDebouncedValue.ts # تأخير قيمة البحث في لوحة التحكم
│   ├── lib/
│   │   ├── supabaseClient.ts    # عميل Supabase
│   │   ├── assets.ts            # روابط الصور العامة (اللوجو وصورة الفريق)
│   │   └── validation.ts        # مخطط Zod للتحقق من نموذج الطلب
│   ├── services/                # كل استدعاءات Supabase من هنا فقط
│   │   ├── committees.ts
│   │   ├── requests.ts
│   │   └── auth.ts
│   ├── pages/
│   │   ├── CommitteesPage.tsx   # الصفحة الرئيسية (اللجان)
│   │   ├── RequestsForm.tsx     # نموذج إرسال الطلبات
│   │   └── AdminDashboard.tsx   # لوحة تحكم الطلبات (محمّلة عند الطلب)
│   ├── types.ts                 # أنواع TypeScript المطابقة لقاعدة البيانات
│   ├── App.tsx                  # التوجيه (Routing) والتخطيط العام
│   └── main.tsx
├── supabase/
│   ├── schema.sql               # المخطط الكامل لمشروع جديد
│   ├── migrations/              # migrations لمشروع Supabase قائم فعلاً
│   └── README.md                # شرح تفصيلي لإعداد قاعدة البيانات
├── .github/workflows/ci.yml     # فحص lint + typecheck + build على كل push/PR
├── vite.config.ts
└── tailwind.config.js           # ألوان وخطوط هوية AYDA البصرية
```

## الأمان

قواعد RLS (Row Level Security) في `supabase/schema.sql` تسمح للزوار بإرسال
طلب جديد فقط؛ قراءة أو تعديل الطلبات (بيانات المرضى) يتطلب أن يكون المستخدم
مسجلاً في جدول `public.admins`. تفاصيل كاملة في
[supabase/README.md](supabase/README.md).

قبل إضافة أي مشرف جديد، تأكد من تعطيل التسجيل العام في
Dashboard → Authentication → Sign In / Up.

## النشر (Vercel)

المشروع مهيأ للنشر على Vercel (`vercel.json` يعيد التوجيه لدعم React Router).
أضف المتغيرين `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` في
Project Settings → Environment Variables على Vercel - ملف `.env` المحلي لا
يُرفع مع الكود ولا يُقرأ في بيئة النشر.
