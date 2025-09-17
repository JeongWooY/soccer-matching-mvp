import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMatchPostsPaginated } from '../../features/match/api/listMatchPostsPaginated'
import type { MatchPost } from '../../types/db'

const PAGE_SIZE = 6

export default function Home() {
  const [items, setItems] = useState<MatchPost[]>([])
  const [pageIndex, setPageIndex] = useState(0)    // 0부터 시작
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // 공통 에러 문자열 변환
  function toMessage(e: unknown) {
    if (e instanceof Error) return e.message
    if (typeof e === 'string') return e
    try { return JSON.stringify(e, null, 2) } catch { return '알 수 없는 오류가 발생했습니다.' }
  }

  // 첫 페이지 로딩
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const { items: first, total } = await listMatchPostsPaginated({
          pageIndex: 0,
          pageSize: PAGE_SIZE,
        })
        setItems(first)
        setTotal(total)
        setPageIndex(0)
        setError(null)
      } catch (e) {
        setError(toMessage(e))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // 무한스크롤 옵저버
  useEffect(() => {
    if (!sentinelRef.current) return
    if (typeof IntersectionObserver === 'undefined') return

    const el = sentinelRef.current
    const io = new IntersectionObserver(async entries => {
      const entry = entries[0]
      if (!entry || !entry.isIntersecting) return
      if (loading || loadingMore) return

      // 이미 모두 로드했다면 요청 금지 → 416 방지
      if (items.length >= total) return

      const nextPage = pageIndex + 1
      try {
        setLoadingMore(true)
        const { items: more } = await listMatchPostsPaginated({
          pageIndex: nextPage,
          pageSize: PAGE_SIZE,
        })
        // 혹시 API가 빈 배열을 주면 더 이상 요청하지 않도록 한 번 더 방어
        if (more.length === 0) return
        setItems(prev => [...prev, ...more])
        setPageIndex(nextPage)
      } catch (e) {
        setError(toMessage(e))
      } finally {
        setLoadingMore(false)
      }
    }, { threshold: 1 })

    io.observe(el)
    return () => io.disconnect()
  }, [pageIndex, total, items.length, loading, loadingMore])

  if (loading) return <PageSkeleton />
  if (error) return <ErrorBox message={error} />

  return (
    <div className="grid gap-6">
      {items.length === 0 && (
        <EmptyState
          title="아직 매치 글이 없어요"
          subtitle="상단의 [New Post] 버튼으로 첫 글을 작성해보세요."
        />
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(p => (
          <Link key={p.id} to={`/post/${p.id}`} className="group relative rounded-3xl overflow-hidden">
            <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 via-sky-500 to-teal-400 blur opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative h-full rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-md ring-1 ring-black/5 dark:ring-white/10 p-6 flex flex-col gap-3 hover:shadow-lg transition-shadow">
              <h2 className="text-lg font-semibold line-clamp-1">{p.title}</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                <Chip icon="📍">{p.location ?? '장소 미정'}</Chip>
                <Chip icon="🗓️">{p.match_date ? new Date(p.match_date).toLocaleDateString() : '일정 미정'}</Chip>
              </div>
              {p.content && <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{p.content}</p>}
              <div className="mt-auto flex justify-end">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">자세히 보기 →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* sentinel */}
      <div ref={sentinelRef} className="h-10" />
      {loadingMore && <LoadingMore />}
      {items.length >= total && total > 0 && (
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-3">모든 글을 다 봤어요 🎉</div>
      )}
    </div>
  )
}

/* ---------- 작은 UI 컴포넌트 ---------- */

function PageSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 rounded-3xl bg-slate-200/60 dark:bg-slate-800/40 animate-pulse" />
      ))}
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200/60 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4">
      <div className="text-red-700 dark:text-red-300 font-medium">문제가 발생했습니다</div>
      <div className="text-sm text-red-600/90 dark:text-red-300/90 mt-1 whitespace-pre-wrap break-all">
        {message}
      </div>
    </div>
  )
}

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-8 text-center">
      <div className="text-lg font-semibold">{title}</div>
      {subtitle && <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</div>}
    </div>
  )
}

function Chip({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-slate-700">
      {icon && <span className="opacity-80">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}

function LoadingMore() {
  return <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">불러오는 중…</div>
}
