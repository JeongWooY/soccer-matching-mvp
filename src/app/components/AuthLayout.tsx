import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-teal-400 blur opacity-40" />
        <div className="relative rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-8">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <span className="text-2xl">⚽</span>
              <span className="font-semibold tracking-tight text-xl">Soccer Matching</span>
            </Link>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
          </div>
          {children}
          <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Soccer Matching
          </p>
        </div>
      </div>
    </div>
  )
}
