import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createMatchPost } from '../../features/match/api/createMatchPost'
import AuthLayout from '../components/AuthLayout'
import TextField from '../components/ui/TextField'
import Button from '../components/ui/Button'

export default function PostNew() {
  const nav = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [location, setLocation] = useState('')
  const [matchDate, setMatchDate] = useState<string>('') // datetime-local 값
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await createMatchPost({
        title,
        content,
        location,
        match_date: matchDate ? new Date(matchDate).toISOString() : null,
      })
      nav(`/post/${data.id}`) // 작성 후 상세페이지로 이동
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="새 매치 작성" subtitle="팀원을 구하거나 매치를 열어보세요.">
      <form onSubmit={onSubmit} className="grid gap-4">
        <TextField
          label="제목"
          placeholder="예: 토요일 축구 상대 구해요"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        <TextField
          label="장소"
          placeholder="평촌 자유 공원"
          value={location}
          onChange={e => setLocation(e.target.value)}
        />

        <label className="grid gap-1.5">
          <span className="text-sm font-medium">날짜 및 시간</span>
          <input
            type="datetime-local"
            className="h-11 rounded-xl px-4 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={matchDate}
            onChange={e => setMatchDate(e.target.value)}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium">내용</span>
          <textarea
            className="min-h-[120px] rounded-xl px-4 py-3 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            placeholder="추가 정보 (예: 참가비, 인원 제한 등)"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </label>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? '작성 중…' : '작성하기'}
        </Button>
      </form>
    </AuthLayout>
  )
}
