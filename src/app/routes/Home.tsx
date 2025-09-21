// src/app/routes/Home.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MatchPost } from '@/types/db'
import { listMatchPostsFiltered } from '@/features/match/api/listMatchPostsFiltered'

const PAGE_SIZE = 9

export default function Home() {
  const [items, setItems] = useState<MatchPost[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // filters
  const [q, setQ] = useState('')
  const [region, setRegion] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState<'latest' | 'dateAsc' | 'dateDesc'>('latest')

  // 첫 로드 + 필터 변경 시
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await listMatchPostsFiltered({ q, region, dateFrom, dateTo, sort, page: 0, pageSize: PAGE_SIZE })
        if (!alive) return
        setItems(res.items)
        setTotal(res.total)
        setPage(0)
        setError(null)
      } catch (e: any) {
        if (!alive) return
        setError(e.message ?? '불러오기에 실패했습니다.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [q, region, dateFrom, dateTo, sort])

  async function loadMore() {
    if (loading || loadingMore) return
    if (items.length >= total) return
    try {
      setLoadingMore(true)
      const nextPage = page + 1
      const res = await listMatchPostsFiltered({ q, region, dateFrom, dateTo, sort, page: nextPage, pageSize: PAGE_SIZE })
      if (res.items.length > 0) {
        setItems(prev => [...prev, ...res.items])
        setPage(nextPage)
      }
    } catch (e: any) {
      setError(e.message ?? '추가 로딩 실패')
    } finally {
      setLoadingMore(false)
    }
  }

  // 스크롤 감지
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) void loadMore()
    }, { threshold: 1 })
    io.observe(el)
    return () => io.disconnect()
  }, [sentinelRef.current, items.length, total, loading, loadingMore])

  return (
    <div className="grid gap-6">
      {/* Filter bar */}
      <div className="rounded-2xl bg-white/70 dark:bg-slate-900/60 ring-1 ring-black/5 dark:ring-white/10 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr,180px,220px,220px,160px]">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="검색: 제목/내용"
            className="h-11 rounded-xl px-4 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            value={region}
            onChange={e => setRegion(e.target.value)}
            placeholder="지역(예: 서울)"
            className="h-11 rounded-xl px-4 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="h-11 rounded-xl px-4 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="h-11 rounded-xl px-4 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10"
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as any)}
            className="h-11 rounded-xl px-3 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10"
          >
            <option value="latest">최신 작성</option>
            <option value="dateAsc">매치일 ↑</option>
            <option value="dateDesc">매치일 ↓</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <GridSkeleton />
      ) : error ? (
        <ErrorBox message={error} />
      ) : items.length === 0 ? (
        <EmptyState title="조건에 맞는 글이 없어요" subtitle="검색어/필터를 조정해 보세요." />
      ) : (
        <>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(p => (
              <li key={p.id} className="group relative rounded-3xl overflow-hidden">
                <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 via-sky-500 to-teal-400 blur opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative h-full rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 p-6 shadow-md hover:shadow-lg transition-shadow flex flex-col gap-3">
                  <Link to={`/post/${p.id}`} className="text-lg font-semibold line-clamp-1 hover:underline underline-offset-2">
                    {p.title}
                  </Link>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Chip icon="📍">{p.location ?? '장소 미정'}</Chip>
                    <Chip icon="🗓️">{p.match_date ? new Date(p.match_date).toLocaleDateString() : '일정 미정'}</Chip>
                  </div>
                  {p.content && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {p.content}
                    </p>
                  )}
                  <div className="mt-auto">
                    <Link to={`/post/${p.id}`} className="inline-flex h-9 px-3 items-center rounded-lg bg-slate-900/80 dark:bg-white/10 text-white text-sm">
                      자세히
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* sentinel */}
          <div ref={sentinelRef} className="h-1" />
          {items.length < total && (
            <div className="text-center">
              <button
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="h-11 px-4 rounded-xl bg-slate-900/80 dark:bg-white/10 text-white disabled:opacity-50"
              >
                {loadingMore ? '불러오는 중…' : '더 보기'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* mini ui */
function GridSkeleton(){return(<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:6}).map((_,i)=>(<div key={i} className="h-40 rounded-3xl bg-slate-200/60 dark:bg-slate-800/40 animate-pulse" />))}</div>)}
function ErrorBox({ message }: { message: string }){return(<div className="rounded-2xl border border-red-200/60 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4"><div className="text-red-700 dark:text-red-300 font-medium">문제가 발생했습니다</div><div className="text-sm text-red-600/90 dark:text-red-300/90 mt-1 whitespace-pre-wrap break-all">{message}</div></div>)}
function EmptyState({ title, subtitle }: { title: string; subtitle?: string }){return(<div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-10 text-center"><div className="text-lg font-semibold">{title}</div>{subtitle && <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</div>}</div>)}
function Chip({ children, icon }: { children: React.ReactNode; icon?: string }){return(<span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-slate-700">{icon && <span className="opacity-80">{icon}</span>}<span>{children}</span></span>)}
