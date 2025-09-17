import { useMatchPosts } from '@/features/match/hooks/useMatchPosts'
import MatchCard from '@/features/match/components/MatchCard'

export default function Home() {
  const { data, isLoading, isError } = useMatchPosts({})
  if (isLoading) return <div>로딩 중…</div>
  if (isError) return <div>불러오기 실패</div>

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">매칭글</h1>
      {!data || data.length === 0 ? (
        <div className="card">아직 매칭글이 없어요. 우측 상단의 ‘매칭글 등록’을 눌러 보세요.</div>
      ) : (
        <div className="space-y-3">
          {data.map(p => <MatchCard key={p.id} post={p} />)}
        </div>
      )}
    </div>
  )
}
