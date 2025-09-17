import { useEffect, useState } from 'react'
import Button from './ui/Button'
import TextField from './ui/TextField'

type Props = {
  open: boolean
  onClose: () => void
  initial: { title: string; content: string | null; location: string | null; match_date: string | null }
  onSubmit: (payload: { title: string; content: string | null; location: string | null; match_date: string | null }) => Promise<void>
}

export default function EditPostModal({ open, onClose, initial, onSubmit }: Props) {
  const [title, setTitle] = useState(initial.title)
  const [content, setContent] = useState(initial.content ?? '')
  const [location, setLocation] = useState(initial.location ?? '')
  const [matchDate, setMatchDate] = useState<string>(initial.match_date ? toLocal(initial.match_date) : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTitle(initial.title)
      setContent(initial.content ?? '')
      setLocation(initial.location ?? '')
      setMatchDate(initial.match_date ? toLocal(initial.match_date) : '')
      setError(null)
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      await onSubmit({
        title,
        content: content || null,
        location: location || null,
        match_date: matchDate ? new Date(matchDate).toISOString() : null
      })
      onClose()
    } catch (e:any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-3">글 수정</h3>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <TextField label="제목" value={title} onChange={e=>setTitle(e.target.value)} required />
          <TextField label="장소" value={location} onChange={e=>setLocation(e.target.value)} />
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">날짜 및 시간</span>
            <input
              type="datetime-local"
              className="h-11 rounded-xl px-4 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={matchDate}
              onChange={e=>setMatchDate(e.target.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">내용</span>
            <textarea
              className="min-h-[120px] rounded-xl px-4 py-3 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              value={content}
              onChange={e=>setContent(e.target.value)}
            />
          </label>
          {error && <div className="text-sm text-rose-500">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="h-11 px-4 rounded-xl bg-slate-200/70 dark:bg-slate-800/60">취소</button>
            <Button type="submit" disabled={loading}>{loading ? '저장 중…' : '저장'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function toLocal(iso: string) {
  const d = new Date(iso)
  const pad=(n:number)=>n.toString().padStart(2,'0')
  const yyyy=d.getFullYear(), mm=pad(d.getMonth()+1), dd=pad(d.getDate()), hh=pad(d.getHours()), mi=pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}
