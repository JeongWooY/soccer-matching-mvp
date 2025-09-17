import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signIn } from '../../features/auth/api'
import AuthLayout from '../components/AuthLayout'
import TextField from '../components/ui/TextField'
import Button from '../components/ui/Button'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      nav('/')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="로그인" subtitle="계정에 접속하고 매치에 참여하세요.">
      <form onSubmit={onSubmit} className="grid gap-4">
        <TextField
          label="이메일"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <div className="grid gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">비밀번호</span>
            <button type="button" className="text-xs text-indigo-600 hover:underline" onClick={() => setShowPw(v => !v)}>
              {showPw ? '숨기기' : '표시'}
            </button>
          </div>
          <input
            className="h-11 rounded-xl px-4 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? '로그인 중…' : '로그인'}
        </Button>

        <div className="text-sm text-slate-600 dark:text-slate-300 text-center">
          계정이 없나요?{' '}
          <Link to="/signup" className="text-indigo-600 hover:underline">회원가입</Link>
        </div>
      </form>
    </AuthLayout>
  )
}
