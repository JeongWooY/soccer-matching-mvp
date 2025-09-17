import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { signOut } from '../features/auth/api'

export default function App() {
  const { user, loading } = useAuth()
  const nav = useNavigate()

  async function handleSignOut() {
    await signOut()
    nav('/')
  }

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-slate-200/70 dark:bg-slate-800/60' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40'}`

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/60 dark:bg-slate-900/40 border-b border-slate-200/70 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span>⚽</span>
            <span>Soccer Matching</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            <NavLink to="/" className={linkCls}>Home</NavLink>
            <NavLink to="/post/new" className={linkCls}>New Post</NavLink>
            <NavLink to="/team" className={linkCls}>Team</NavLink>
            {user && <NavLink to="/me" className={linkCls}>Me</NavLink>}
            {!loading && !user && <NavLink to="/login" className={linkCls}>Login</NavLink>}
            {!loading && !user && <NavLink to="/signup" className={linkCls}>Signup</NavLink>}
            {!loading && user && (
              <button onClick={handleSignOut} className="px-3 py-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/40">
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
