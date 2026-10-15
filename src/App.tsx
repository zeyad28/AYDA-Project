import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Toaster } from 'sonner'
import Navbar from './components/Navbar'
import CommitteesPage from './pages/CommitteesPage'

// Route-level code splitting: the home page (above) is what every visitor
// loads first, so it stays in the main bundle. The request form (react-hook-form
// + zod) and the admin dashboard (auth + table + CSV export) are only needed
// by a fraction of visits, so they ship as separate chunks fetched on demand.
const RequestsForm = lazy(() => import('./pages/RequestsForm'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

function RouteLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="font-bold text-ink/40">جاري التحميل...</p>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center" dir="rtl">
      <span className="font-display text-6xl font-bold text-teal/20">404</span>
      <h1 className="font-display text-2xl font-bold">هذه الصفحة غير موجودة</h1>
      <p className="text-ink/60">يمكنك العودة للرئيسية أو إرسال طلب مساعدة</p>
      <Link
        to="/"
        className="rounded-xl bg-teal px-6 py-3 font-bold text-white shadow-card transition hover:bg-teal-dark"
      >
        العودة للرئيسية
      </Link>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster richColors position="top-center" dir="rtl" />
      <div className="flex min-h-screen flex-col" dir="rtl">
        <Navbar />

        <main className="flex-1">
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<CommitteesPage />} />
              <Route path="/request" element={<RequestsForm />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>

        <footer className="border-t border-line bg-white/60 px-6 py-5 text-center text-sm text-ink/60">
          <p>
            Developed by <span className="font-bold text-teal">Coder Zone Academy</span> — Supervised
            by <span className="font-bold text-teal">Eng. Zeyad Emara</span>
          </p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
