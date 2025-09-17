import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { listMatchPosts } from '../../features/match/api/listMatchPosts'
import { listMyReservations } from '../../features/match/api/listMyReservations'
import { deleteMatchPost } from '../../features/match/api/deleteMatchPost'
import { updateMatchPost } from '../../features/match/api/updateMatchPost'
import type { MatchPost, Reservation } from '../../types/db'
import EditPostModal from '../components/EditPostModal'
import { useToast } from '../components/toast/ToastProvider'
import type { ReactNode } from 'react'


type TabKey = 'posts' | 'reservations'

export default function Me() {
  const { user } = useAuth()
  const { push } = useToast()

  const [tab, setTab] = useState<TabKey>('posts')
  const [allPosts, setAllPosts] = useState<MatchPost[]>([])
  const [myPosts, setMyPosts] = useState<MatchPost[]>([])
  const [myRes, setMyRes] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<MatchPost | null>(null)

  const myId = user?.id

  useEffect(() => {
    if (!myId) return
    setLoading(true)
    ;(async () => {
      try {
        const posts = await listMatchPosts()
        setAllPosts(posts)
        setMyPosts(posts.filter(p => p.created_by === myId))
        const res = await listMyReservations()
        setMyRes(res)
        setError(null)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [myId])

  async function handleDeletePost(id: string) {
    if (!confirm('정말 이 글을 삭제할까요?')) return
    setPending(id)
    try {
      await deleteMatchPost(id)
      setMyPosts(prev => prev.filter(p => p.id !== id))
      push('삭제가 완료되었습니다.')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setPending(null)
    }
  }

  if (!myId) return <GuardBox title="로그인이 필요합니다" action={<Link className="text-indigo-600 hover:underline" to="/login">로그인하러 가기 →</Link>} />
  if (loading) return <PageSkeleton />
  if (error) return <ErrorBox message={error} />

  const myPostsCount = myPosts.length
  const myResCount = myRes.length

  return (
    <div className="grid gap-6">
      <header className="rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 p-6 shadow-md">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">내 활동</h1>
          <span className="text-sm text-slate-500 dark:text-slate-400">나의 글과 신청 내역을 확인하세요.</span>
        </div>
        <div className="mt-4 inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <TabButton active={tab === 'posts'} onClick={() => setTab('posts')}>
            내가 쓴 글 <Badge tone="indigo">{myPostsCount}</Badge>
          </TabButton>
          <TabButton active={tab === 'reservations'} onClick={() => setTab('reservations')}>
            내가 신청한 글 <Badge tone="slate">{myResCount}</Badge>
          </TabButton>
        </div>
      </header>

      {tab === 'posts' ? (
        <section className="grid gap-4">
          {myPostsCount === 0 ? (
            <EmptyState title="아직 작성한 글이 없어요" subtitle={<span>상단의 <Link to="/post/new" className="text-indigo-600 hover:underline">New Post</Link>로 첫 글을 작성해보세요.</span>} />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myPosts.map(p => (
                <li key={p.id} className="group relative rounded-3xl overflow-hidden">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 via-sky-500 to-teal-400 blur opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="relative h-full rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 p-5 flex flex-col gap-3 shadow-md hover:shadow-lg transition-shadow">
                    <Link to={`/post/${p.id}`} className="text-lg font-semibold line-clamp-1 hover:underline">{p.title}</Link>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Chip icon="📍">{p.location ?? '장소 미정'}</Chip>
                      <Chip icon="🗓️">{p.match_date ? new Date(p.match_date).toLocaleDateString() : '일정 미정'}</Chip>
                    </div>
                    {p.content && <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{p.content}</p>}
                    <div className="mt-auto flex items-center justify-between">
                      <Link to={`/post/${p.id}`} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">상세 보기 →</Link>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditing(p); setEditOpen(true) }} className="text-xs px-3 py-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800/60">수정</button>
                        <button onClick={() => handleDeletePost(p.id)} disabled={pending === p.id} className="text-xs px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50" title="삭제">
                          {pending === p.id ? '삭제 중…' : '삭제'}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="grid gap-3">
          {myResCount === 0 ? (
            <EmptyState title="아직 신청한 매치가 없어요" subtitle={<span><Link to="/" className="text-indigo-600 hover:underline">홈</Link>에서 관심 있는 글에 신청해보세요.</span>} />
          ) : (
            <ul className="grid gap-3">
              {myRes.map(r => {
                const post = allPosts.find(p => p.id === r.post_id)
                return (
                  <li key={r.id} className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={r.status} />
                      <div className="text-sm">
                        <Link to={`/post/${r.post_id}`} className="font-medium hover:underline">
                          {post?.title ?? '게시글'}
                        </Link>
                        <div className="text-slate-500 dark:text-slate-400">
                          {new Date(r.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {post?.location ?? '장소 미정'} • {post?.match_date ? new Date(post.match_date).toLocaleDateString() : '일정 미정'}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      <EditPostModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={{
          title: editing?.title ?? '',
          content: editing?.content ?? '',
          location: editing?.location ?? '',
          match_date: editing?.match_date ?? null
        }}
        onSubmit={async (payload) => {
          if (!editing) return
          const updated = await updateMatchPost(editing.id, payload)
          setMyPosts(prev => prev.map(p => p.id === updated.id ? updated : p))
          setEditOpen(false)
          setEditing(null)
          push('수정이 저장되었습니다.')
        }}
      />
    </div>
  )
}

/* UI helpers */
function PageSkeleton(){return(<div className="grid gap-6"><div className="h-28 rounded-3xl bg-slate-200/60 dark:bg-slate-800/40 animate-pulse" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:6}).map((_,i)=><div key={i} className="h-36 rounded-3xl bg-slate-200/60 dark:bg-slate-800/40 animate-pulse" />)}</div></div>)}
function ErrorBox({ message }: { message: string }){return(<div className="rounded-2xl border border-red-200/60 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4"><div className="text-red-700 dark:text-red-300 font-medium">문제가 발생했습니다</div><div className="text-sm text-red-600/90 dark:text-red-300/90 mt-1">{message}</div></div>)}
function GuardBox({ title, action }: { title: string; action?: React.ReactNode }){return(<div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-8 text-center"><div className="text-lg font-semibold">{title}</div>{action && <div className="mt-2">{action}</div>}</div>)}
function EmptyState({ title, subtitle }: { title: string; subtitle?: React.ReactNode }){return(<div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-8 text-center"><div className="text-lg font-semibold">{title}</div>{subtitle && <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</div>}</div>)}
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }){return(<button onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/40'}`}><span className="inline-flex items-center gap-2">{children}</span></button>)}
type BadgeProps = { children: ReactNode; tone?: 'indigo' | 'slate' }
function Badge({ children, tone = 'indigo' }: BadgeProps) {
  const cls =
    tone === 'indigo'
      ? 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 ring-indigo-600/20'
      : 'bg-slate-600/10 text-slate-700 dark:text-slate-300 ring-slate-600/20'
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ${cls}`}>
      {children}
    </span>
  )
}

type ChipProps = { children: ReactNode; icon?: string }
function Chip({ children, icon }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-slate-700">
      {icon && <span className="opacity-80">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
function StatusBadge({ status }: { status: Reservation['status'] }){const map:Record<Reservation['status'],string>={requested:'bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300',accepted:'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300',rejected:'bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300',canceled:'bg-slate-500/15 text-slate-700 ring-slate-500/30 dark:text-slate-300'};return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${map[status]}`}>{status}</span>}
