// src/app/App.tsx
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../features/auth/useAuth'
import { signOut } from '../features/auth/api'

export default function App() {
  const { user, loading } = useAuth()
  const nav = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    setMenuOpen(false)
    nav('/')
  }

  // (선택) 다크모드 토글
  const [dark, setDark] = useState(
    () => typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
  )
  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

const initials = useMemo(
  () => user?.email?.[0]?.toUpperCase() ?? 'U',
  [user?.email]
)

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/40">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-3">
          {/* Logo */}
          <Link to="/" className="font-semibold inline-flex items-center gap-2">
            <span className="text-lg">⚽</span>
            <span className="tracking-tight">Soccer Matching</span>
          </Link>

          {/* Nav */}
          <nav className="ml-4 hidden md:flex items-center gap-1 text-sm rounded-xl bg-slate-100/70 dark:bg-slate-800/50 p-1">
            <Nav to="/">Home</Nav>
            <Nav to="/post/new">New Match</Nav>
            <Nav to="/team">Team</Nav>
            <Nav to="/team/invites">Invites</Nav>
            <Nav to="/team/requests">Requests</Nav>
            <Nav to="/me">My Page</Nav>
          </nav>

          {/* Right */}
          <div className="ml-auto flex items-center gap-2">
            {/* Dark toggle */}
            <button
              title="Toggle theme"
              onClick={() => setDark(v => !v)}
              className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-slate-200/70 dark:ring-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              {dark ? '🌙' : '☀️'}
            </button>

            {loading ? (
              <div className="h-9 w-9 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="h-9 pl-2 pr-3 rounded-xl bg-slate-900/80 dark:bg-white/10 text-white text-sm inline-flex items-center gap-2"
                >
                  <span className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-500 via-sky-500 to-teal-400 text-xs grid place-items-center">
                    {initials}
                  </span>
                  <span className="hidden sm:inline-block max-w-[140px] truncate opacity-90">{user.email}</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden border border-slate-200/70 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-xl">
                    <MenuItem to="/me" onClick={() => setMenuOpen(false)}>My Page</MenuItem>
                    <MenuItem to="/team">Teams</MenuItem>
                    <MenuItem to="/team/invites">Invites</MenuItem>
                    <MenuItem to="/team/requests">Requests</MenuItem>
                    <div className="h-px bg-slate-200 dark:bg-slate-800" />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="h-6 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="h-6 px-3 rounded-xl ring-1 ring-slate-300 dark:ring-slate-700 text-sm hover:bg-slate-100 dark:hover:bg-slate-800/50"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu (hamburger) */}
            <MobileMenu />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  )
}

/* ───────────────── components ───────────────── */

function Nav({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'px-3 py-1.5 rounded-lg transition-colors',
          'hover:bg-white/70 dark:hover:bg-slate-900/50',
          isActive
            ? 'bg-white dark:bg-slate-900 shadow ring-1 ring-black/5 dark:ring-white/10'
            : 'text-slate-600 dark:text-slate-300',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

function MenuItem({
  to,
  onClick,
  children,
}: {
  to: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2 text-sm hover:bg-white dark:hover:bg-slate-800/60"
    >
      {children}
    </Link>
  )
}

/* 모바일 메뉴: 공간만 차지(햄버거 아이콘) — 필요 시 확장 가능 */
function MobileMenu() {
  return (
    <div className="md:hidden">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-slate-200/70 dark:ring-slate-700 opacity-60">
        ☰
      </span>
    </div>
  )
}
