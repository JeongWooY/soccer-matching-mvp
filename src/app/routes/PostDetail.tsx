import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMatchPostById } from '../../features/match/api/getMatchPostById'
import { reserveMatch } from '../../features/match/api/reserveMatch'
import { respondReservation } from '../../features/match/api/respondReservation'
import { cancelReservation } from '../../features/match/api/cancelReservation'
import type { MatchPost, Reservation } from '../../types/db'
import { useAuth } from '../../features/auth/useAuth'
import EditPostModal from '../components/EditPostModal'
import { updateMatchPost } from '../../features/match/api/updateMatchPost'
import { useToast } from '../components/toast/ToastProvider'
import type { ReactNode } from 'react'

export default function PostDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { push } = useToast()

  const [post, setPost] = useState<MatchPost | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editOpen, setEditOpen] = useState(false)

  const isOwner = useMemo(() => user?.id && post?.created_by === user.id, [user?.id, post?.created_by])
  const myRes = reservations?.find(r => r.requester_id === user?.id)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    ;(async () => {
      try {
        const data = await getMatchPostById(id)
        setPost(data)
        setReservations(data.reservations ?? [])
        setError(null)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [id, refreshKey])

  async function handleReserve() {
    if (!id || pending) return
    setPending(true)
    try {
      await reserveMatch(id)
      push('신청이 완료되었습니다.')
      setRefreshKey(k => k + 1)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setPending(false)
    }
  }

  async function handleRespond(resId: string, next: 'accepted' | 'rejected') {
    if (pending) return
    setPending(true)
    try {
      await respondReservation(resId, next)
      push(next === 'accepted' ? '신청을 수락했습니다.' : '신청을 거절했습니다.')
      setRefreshKey(k => k + 1)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setPending(false)
    }
  }

  async function handleCancel(resId: string) {
    if (pending) return
    setPending(true)
    try {
      await cancelReservation(resId)
      push('신청을 취소했습니다.')
      setRefreshKey(k => k + 1)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setPending(false)
    }
  }

  async function submitEdit(payload: { title: string; content: string | null; location: string | null; match_date: string | null }) {
    if (!post) return
    await updateMatchPost(post.id, payload)
    push('수정이 저장되었습니다.')
    setEditOpen(false)
    setRefreshKey(k => k + 1)
  }

  if (loading) return <PageSkeleton />
  if (error) return <ErrorBox message={error} />
  if (!post) return <EmptyState title="게시글을 찾을 수 없어요" subtitle="삭제되었거나 권한이 없을 수 있어요." />

  const dateText = post.match_date ? new Date(post.match_date).toLocaleString() : '일정 미정'
  const locationText = post.location ?? '장소 미정'

  return (
    <div className="grid gap-6">
      <div className="relative">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-teal-400 blur opacity-30" />
        <div className="relative rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{post.title}</h1>
              <div className="ml-auto flex items-center gap-2">
                <Badge tone="slate">{isOwner ? '내가 작성' : '공개'}</Badge>
                {isOwner && (
                  <SecondaryButton onClick={() => setEditOpen(true)}>수정</SecondaryButton>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Chip icon="📍">{locationText}</Chip>
              <Chip icon="🗓️">{dateText}</Chip>
            </div>
            {post.content && (
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {!isOwner && user && !myRes && (
                <PrimaryButton onClick={handleReserve} disabled={pending}>
                  {pending ? '신청 중…' : '이 매치 신청하기'}
                </PrimaryButton>
              )}
              {!user && (
                <SecondaryButton onClick={() => (window.location.href = '/login')}>
                  로그인하고 신청하기
                </SecondaryButton>
              )}
              {myRes && myRes.status === 'requested' && (
                <TertiaryButton onClick={() => handleCancel(myRes.id)} disabled={pending}>
                  {pending ? '취소 중…' : '신청 취소'}
                </TertiaryButton>
              )}
              {myRes && myRes.status !== 'requested' && (
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  나의 상태: <StatusBadge status={myRes.status} />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">신청 목록</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">{reservations.length}건</span>
        </div>
        {reservations.length === 0 ? (
          <EmptyRow text="아직 신청이 없습니다." />
        ) : (
          <ul className="grid gap-3">
            {reservations.map(r => (
              <li
                key={r.id}
                className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} />
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOwner && r.status === 'requested' && (
                    <>
                      <PrimaryButton size="sm" onClick={() => handleRespond(r.id, 'accepted')} disabled={pending}>수락</PrimaryButton>
                      <DangerButton size="sm" onClick={() => handleRespond(r.id, 'rejected')} disabled={pending}>거절</DangerButton>
                    </>
                  )}
                  {user?.id === r.requester_id && r.status === 'requested' && (
                    <TertiaryButton size="sm" onClick={() => handleCancel(r.id)} disabled={pending}>취소</TertiaryButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EditPostModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={{ title: post.title, content: post.content, location: post.location, match_date: post.match_date }}
        onSubmit={submitEdit}
      />
    </div>
  )
}

/* UI helpers */
function PageSkeleton(){return(<div className="animate-pulse grid gap-6"><div className="h-40 rounded-3xl bg-slate-200/60 dark:bg-slate-800/40" /><div className="h-64 rounded-2xl bg-slate-200/50 dark:bg-slate-800/30" /></div>)}
function ErrorBox({ message }: { message: string }){return(<div className="rounded-2xl border border-red-200/60 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4"><div className="text-red-700 dark:text-red-300 font-medium">문제가 발생했습니다</div><div className="text-sm text-red-600/90 dark:text-red-300/90 mt-1">{message}</div></div>)}
function EmptyState({ title, subtitle }: { title: string; subtitle?: string }){return(<div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-8 text-center"><div className="text-lg font-semibold">{title}</div>{subtitle && <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</div>}</div>)}
function EmptyRow({ text }: { text: string }){return <div className="text-sm text-slate-500 dark:text-slate-400">{text}</div>}
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
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: 'sm' | 'md' }
function PrimaryButton({ className = '', size = 'md', ...props }: BtnProps){const sz=size==='sm'?'h-9 px-3 text-sm':'h-11 px-4';return(<button className={`${sz} rounded-xl font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`} {...props} />)}
function SecondaryButton({ className = '', size = 'md', ...props }: BtnProps){const sz=size==='sm'?'h-9 px-3 text-sm':'h-11 px-4';return(<button className={`${sz} rounded-xl font-medium bg-slate-900/80 dark:bg-white/10 text-white hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`} {...props} />)}
function TertiaryButton({ className = '', size = 'md', ...props }: BtnProps){const sz=size==='sm'?'h-9 px-3 text-sm':'h-11 px-4';return(<button className={`${sz} rounded-xl font-medium bg-slate-200/80 dark:bg-slate-800/60 hover:bg-slate-200 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`} {...props} />)}
function DangerButton({ className = '', size = 'md', ...props }: BtnProps){const sz=size==='sm'?'h-9 px-3 text-sm':'h-11 px-4';return(<button className={`${sz} rounded-xl font-medium bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`} {...props} />)}
