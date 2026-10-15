import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { LOGO_URL, getOptimizedImageUrl } from '../lib/assets'

const NAV_LOGO_URL = getOptimizedImageUrl(LOGO_URL, { width: 68, height: 68, quality: 85 })

const linkClass =
  'whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-bold text-ink/60 transition hover:text-ink'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const onAdmin = pathname.startsWith('/admin')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors ${
        scrolled ? 'border-line bg-sand/85 shadow-card backdrop-blur-md' : 'border-transparent bg-sand/60 backdrop-blur-sm'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-6" aria-label="التنقل الرئيسي">
        <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <span className="rounded-xl bg-brand-fade p-[2px] shadow-card">
            <img src={NAV_LOGO_URL} alt="" width="34" height="34" className="h-[30px] w-[30px] rounded-[0.85rem] bg-sand object-cover sm:h-[34px] sm:w-[34px] sm:rounded-[0.9rem]" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-ink">AYDA</span>
        </Link>

        {/* Only the pages you're not currently on appear here - no point
            linking to where you already are, and it keeps the mobile header
            from wrapping. */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {pathname !== '/' && (
            <NavLink to="/" end className={linkClass}>
              الرئيسية
            </NavLink>
          )}
          {pathname !== '/request' && (
            <NavLink to="/request" className={linkClass}>
              إرسال طلب
            </NavLink>
          )}
          <NavLink
            to="/admin"
            aria-label="لوحة التحكم"
            title="لوحة التحكم"
            className={`mr-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition sm:mr-2 ${
              onAdmin ? 'border-teal bg-teal-soft text-teal-dark' : 'border-line text-ink/40 hover:border-teal hover:text-teal'
            }`}
          >
            <Lock className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </NavLink>
        </div>
      </nav>
    </header>
  )
}
