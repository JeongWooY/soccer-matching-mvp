import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp } from '../../features/auth/api'
import AuthLayout from '../components/AuthLayout'
import TextField from '../components/ui/TextField'
import Button from '../components/ui/Button'

export default function Signup() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다.')
    if (password !== confirm) return setError('비밀번호가 일치하지 않습니다.')

    setLoading(true)
    try {
      await signUp(email, password)
      nav('/') // 이메일 확인 OFF면 즉시 로그인됨
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="회원가입" subtitle="간단히 가입하고 지금 바로 시작하세요.">
      <form onSubmit={onSubmit} className="grid gap-4">
        <TextField
          label="이메일"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          label="비밀번호"
          type="password"
          placeholder="최소 6자"
          autoComplete="new-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <TextField
          label="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? '가입 중…' : '가입하기'}
        </Button>

        <div className="text-sm text-slate-600 dark:text-slate-300 text-center">
          이미 계정이 있나요?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">로그인</Link>
        </div>
      </form>
    </AuthLayout>
  )
}
