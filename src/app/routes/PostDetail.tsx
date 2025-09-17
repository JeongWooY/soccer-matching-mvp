import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMatchPostById } from '@/features/match/api/getMatchPostById'
import { reserveMatch } from '@/features/match/api/reserveMatch'

export default function PostDetail() {
  const { id } = useParams()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getMatchPostById(id)
      .then(setPost)
      .catch(e => setError(e.message ?? '에러'))
      .finally(() => setLoading(false))
  }, [id])

  const onReserve = async () => {
    try {
      const defaultTeamId = import.meta.env.VITE_DEFAULT_TEAM_ID as string | undefined
      await reserveMatch(id!, defaultTeamId ?? null as any, '예약 신청합니다!')
      alert('예약 신청 완료!')
    } catch (e:any) {
      alert(e.message ?? '예약 실패')
    }
  }

  if (loading) return <div>로딩 중…</div>
  if (error || !post) return <div className="card">불러오기 실패: {error}</div>

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-sm opacity-80">{post.date} · {post.start_time}~{post.end_time}</div>
        <div className="text-xl font-semibold">{post.venue}</div>
        <div className="opacity-80 text-sm">{post.city ?? ''} · 레벨 {post.level ?? '미지정'} · {post.fee_split ?? ''}</div>
        {post.openchat_url && <a href={post.openchat_url} target="_blank" className="btn mt-3">오픈채팅 열기</a>}
      </div>
      <button className="btn" onClick={onReserve}>예약 신청</button>
    </div>
  )
}
