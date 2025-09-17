import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMatchPostById } from '@/features/match/api/getMatchPostById'
import { reserveMatch } from '@/features/match/api/reserveMatch'
import ReservationList from '@/features/match/components/ReservationList'

export default function PostDetail() {
  const { id } = useParams()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!id) return
    getMatchPostById(id)
      .then(setPost)
      .catch(e => setError(e.message ?? '에러'))
      .finally(() => setLoading(false))
  }, [id])

const onReserve = async () => {
  try {
    const defaultTeamId = import.meta.env.VITE_DEFAULT_TEAM_ID?.trim() || null;
    await reserveMatch({ postId: id!, requesterTeamId: defaultTeamId, message: '예약 신청합니다!' });
    alert('예약 신청 완료!');
    setRefreshKey(k => k + 1);
  } catch (e:any) {
    alert(e.message ?? '예약 실패');
  }
};

  if (loading) return <div>로딩 중…</div>
  if (error || !post) return <div className="card">불러오기 실패: {error}</div>

  return (
    <div className="space-y-4">
    <div className="card">
    <div className="text-sm opacity-80">
      {post.date} · {post.start_time}~{post.end_time}
    </div>
    <div className="text-xl font-semibold flex items-center gap-2">
      {post.venue}
      {post.status && (
        <span className="text-xs px-2 py-1 rounded-full border border-white/20">
          {post.status}
        </span>
      )}
    </div>
    <div className="opacity-80 text-sm">
      {post.city ?? ''} · 레벨 {post.level ?? '미지정'} · {post.fee_split ?? ''}
    </div>
    {post.openchat_url && <a href={post.openchat_url} target="_blank" className="btn mt-3">오픈채팅 열기</a>}
  </div>
      <button className="btn" onClick={onReserve}>예약 신청</button>
     <h2 className="text-lg font-semibold">예약 신청 목록</h2>
      <ReservationList key={refreshKey} postId={id!} />  {/* ← 이 줄 */}
    </div>
    
  )
}
