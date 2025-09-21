// src/app/routes/PostDetail.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../features/auth/useAuth'
import { useToast } from '../components/toast/ToastProvider'
import { supabase } from '../../lib/supabase'

import { getMatchPostById } from '../../features/match/api/getMatchPostById'
import { reserveMatch } from '../../features/match/api/reserveMatch'
import { respondReservation } from '../../features/match/api/respondReservation'
import { cancelReservation } from '../../features/match/api/cancelReservation'
import { updateMatchPost } from '../../features/match/api/updateMatchPost'

import { listComments } from '@/features/match/api/listComments'
import { addComment } from '@/features/match/api/addComment'
import { deleteComment } from '@/features/match/api/deleteComment'

import { listCommentReactions } from '@/features/match/api/listCommentReactions'
import { toggleReaction } from '@/features/match/api/toggleReaction'
import { searchProfiles, type MentionUser } from '@/features/auth/searchProfiles'

import type { MatchPost, Reservation, Comment } from '../../types/db'
import EditPostModal from '../components/EditPostModal'

/** ✅ useParams().id를 항상 string으로 보장하는 헬퍼 */
function requirePostId(id?: string): string {
  if (!id) throw new Error('잘못된 주소입니다: 게시글 id가 없습니다.')
  return id
}

export default function PostDetail() {
  const { id: idParam } = useParams<{ id: string }>()
  const postId = useMemo(() => requirePostId(idParam), [idParam]) // ← 모든 곳에서 이걸 사용
  const { user } = useAuth()
  const { push } = useToast()

  const [post, setPost] = useState<MatchPost | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [comments, setComments] = useState<Comment[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editOpen, setEditOpen] = useState(false)

  const [cInput, setCInput] = useState('')
  const [cBusy, setCBusy] = useState(false)

  const isOwner = useMemo(() => user?.id && post?.created_by === user.id, [user?.id, post?.created_by])
  const myRes = reservations?.find(r => r.requester_id === user?.id)

  // ----- 멘션 자동완성 -----
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionItems, setMentionItems] = useState<MentionUser[]>([])
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)

  // 이모지 반응 중복 클릭 방지
  const [reactingId, setReactingId] = useState<string | null>(null)

  // @ 뒤의 질의 추출
function findMentionQuery(
  text: string,
  cursor: number
): { from: number; q: string } | null {
  let i = cursor - 1
  while (i >= 0) {
    const ch = text[i]
    if (ch === '@') {
      return { from: i, q: text.slice(i + 1, cursor) }
    }
    if (ch && /\s/.test(ch)) break   // ✅ 안전하게 처리
    i--
  }
  return null
}


  // 초기 로드
  useEffect(() => {
    setLoading(true)
    ;(async () => {
      try {
        const data = await getMatchPostById(postId)
        setPost(data)
        setReservations(data.reservations ?? [])
        const cs = await listComments(postId)
        setComments(cs)
        setError(null)
      } catch (e: any) {
        setError(e.message ?? '불러오기에 실패했습니다.')
      } finally {
        setLoading(false)
      }
    })()
  }, [postId, refreshKey])

  // 댓글 실시간 구독
  useEffect(() => {
    const existing = new Set(comments.map(c => c.id))
    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row: any = payload.new
            if (!existing.has(row.id)) setComments(prev => [...prev, row])
          } else if (payload.eventType === 'DELETE') {
            const row: any = payload.old
            setComments(prev => prev.filter(c => c.id !== row.id))
          } else if (payload.eventType === 'UPDATE') {
            const row: any = payload.new
            setComments(prev => prev.map(c => (c.id === row.id ? { ...c, ...row } : c)))
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, comments.length])

  async function handleReserve() {
    if (pending) return
    setPending(true)
    try {
      await reserveMatch(postId)
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

  // 글 수정
  async function submitEdit(payload: { title: string; content: string | null; location: string | null; match_date: string | null }) {
    if (!post) return
    await updateMatchPost(post.id, payload)
    push('수정이 저장되었습니다.')
    setEditOpen(false)
    setRefreshKey(k => k + 1)
  }

  // 댓글 입력 변경(+멘션 자동완성)
async function onCommentChange(e: React.ChangeEvent<HTMLInputElement>) {
  const v = e.target.value
  setCInput(v)

  const pos = e.target.selectionStart ?? v.length
  const hit = findMentionQuery(v, pos)

  // 1) hit가 없으면 즉시 종료
  if (!hit) {
    setMentionOpen(false)
    return
  }

  // 2) q를 뽑아서 가드(이 라인으로 인해 q: string로 좁혀짐)
  const q = hit.q
  if (!q) {
    setMentionOpen(false)
    return
  }

  // 3) UI 위치 계산
  const rect = e.currentTarget.getBoundingClientRect()
  setMenuPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + 8 })

  // 4) 검색 실행
  try {
    const items = await searchProfiles(q) // ← q는 이제 string 확정
    setMentionItems(items)
    setMentionOpen(items.length > 0)
  } catch {
    setMentionOpen(false)
  }
}

  // 댓글 작성
  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    const text = cInput.trim()
    if (!text) return
    try {
      setCBusy(true)
      const newC = await addComment(postId, text)
      setComments(prev => [...prev, newC])
      setCInput('')
    } catch (e: any) {
      push(e.message ?? '댓글 작성에 실패했습니다.')
    } finally {
      setCBusy(false)
    }
  }

  // 댓글 삭제
  async function removeComment(cid: string) {
    if (!confirm('댓글을 삭제할까요?')) return
    try {
      await deleteComment(cid)
      setComments(prev => prev.filter(c => c.id !== cid))
    } catch (e: any) {
      push(e.message ?? '댓글 삭제에 실패했습니다.')
    }
  }

  // 멘션 아이템 적용
   function applyMention(m: MentionUser) {
  const el = inputRef.current; // HTMLInputElement | null
  const v = cInput;            // 현재 입력 값

  // 커서 위치(엘리먼트가 없으면 문자열 끝 기준)
  const pos = el?.selectionStart ?? v.length;

  // 현재 커서 기준으로 @쿼리 탐색
  const hit = findMentionQuery(v, pos);
  if (!hit) {
    setMentionOpen(false);
    return;
  }

  // mention 문자열 만들기
  const nickname = m.nickname ?? "user";
  const mentionText = "@" + nickname + " ";

  // 치환된 새 텍스트
  const next = v.slice(0, hit.from) + mentionText + v.slice(pos);
  setCInput(next);
  setMentionOpen(false);

  // 커서를 멘션 뒤로 이동
  const newCaret = hit.from + mentionText.length;

  // 렌더 후 커서 이동 & 포커스
  requestAnimationFrame(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    // setSelectionRange은 HTMLInputElement에 존재
    input.setSelectionRange(newCaret, newCaret);
  });
}


  // ----- 렌더 가드 -----
  if (loading) return <PageSkeleton />
  if (error) return <ErrorBox message={error} />
  if (!post) return <EmptyState title="게시글을 찾을 수 없어요" subtitle="삭제되었거나 권한이 없을 수 있어요." />

  const dateText = post.match_date ? new Date(post.match_date).toLocaleString() : '일정 미정'
  const locationText = post.location ?? '장소 미정'

  return (
    <div className="grid gap-6">
      {/* 헤더 카드 */}
      <div className="relative">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-teal-400 blur opacity-30" />
        <div className="relative rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{post.title}</h1>
              <div className="ml-auto flex items-center gap-2">
                <Badge tone="slate">{isOwner ? '내가 작성' : '공개'}</Badge>
                {isOwner && <SecondaryButton onClick={() => setEditOpen(true)}>수정</SecondaryButton>}
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

            {/* 액션 영역 */}
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

      {/* 예약 리스트 섹션 */}
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
                      <PrimaryButton size="sm" onClick={() => handleRespond(r.id, 'accepted')} disabled={pending}>
                        수락
                      </PrimaryButton>
                      <DangerButton size="sm" onClick={() => handleRespond(r.id, 'rejected')} disabled={pending}>
                        거절
                      </DangerButton>
                    </>
                  )}
                  {user?.id === r.requester_id && r.status === 'requested' && (
                    <TertiaryButton size="sm" onClick={() => handleCancel(r.id)} disabled={pending}>
                      취소
                    </TertiaryButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 💬 댓글 섹션 */}
      <section className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4">
        <h2 className="font-semibold mb-3">댓글</h2>

        {user ? (
          <div className="relative mb-3">
            <form onSubmit={submitComment} className="grid sm:grid-cols-[1fr_auto] gap-2">
              <input
                ref={inputRef}
                value={cInput}
                onChange={onCommentChange}
                placeholder="매치 관련 질문/의견을 남겨보세요… (@닉네임)"
                className="h-11 rounded-xl px-4 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                disabled={cBusy || !cInput.trim()}
                className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
              >
                {cBusy ? '작성 중…' : '등록'}
              </button>
            </form>

            {mentionOpen && menuPos && mentionItems.length > 0 && (
              <div
                className="absolute z-50 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg"
                style={{ top: menuPos.top, left: menuPos.left }}
              >
                <ul className="max-h-64 overflow-auto p-1">
                  {mentionItems.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => applyMention(m)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        @{m.nickname ?? 'user'} {m.email ? <span className="text-xs opacity-60">({m.email})</span> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-3 text-sm text-slate-500">댓글을 작성하려면 로그인 해주세요.</div>
        )}

        {comments.length === 0 ? (
          <EmptyRow text="첫 댓글을 남겨보세요!" />
        ) : (
          <ul className="grid gap-2">
            {comments.map(c => {
              const canDelete = isOwner || c.author_id === user?.id
              return (
                <li key={c.id} className="rounded-xl border border-slate-200/70 dark:border-slate-800 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{(c.author_id ?? '익명').slice(0, 8)}</span>
                        <span className="text-slate-500">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <div className="mt-1 whitespace-pre-wrap break-words">
                        {highlightMentions(c.content)}
                      </div>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => removeComment(c.id)}
                        className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <ReactionBar
                    commentId={c.id}
                    reactingId={reactingId}
                    setReactingId={setReactingId}
                  />
                </li>
              )
            })}
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

/* ---------- 유틸 / 작은 컴포넌트들 ---------- */

function highlightMentions(text: string) {
  const parts = text.split(/(@[^\s]+)/g)
  return parts.map((p, i) =>
    p.startsWith('@')
      ? <span key={i} className="text-indigo-600 dark:text-indigo-400 font-medium">{p}</span>
      : <span key={i}>{p}</span>
  )
}

function PageSkeleton() {
  return (
    <div className="animate-pulse grid gap-6">
      <div className="h-40 rounded-3xl bg-slate-200/60 dark:bg-slate-800/40" />
      <div className="h-64 rounded-2xl bg-slate-200/50 dark:bg-slate-800/30" />
    </div>
  )
}
function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200/60 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4">
      <div className="text-red-700 dark:text-red-300 font-medium">문제가 발생했습니다</div>
      <div className="text-sm text-red-600/90 dark:text-red-300/90 mt-1">{message}</div>
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
function EmptyRow({ text }: { text: string }) { return <div className="text-sm text-slate-500 dark:text-slate-400">{text}</div> }

type BadgeProps = { children: ReactNode; tone?: 'indigo' | 'slate' }
function Badge({ children, tone = 'indigo' }: BadgeProps) {
  const cls =
    tone === 'indigo'
      ? 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 ring-indigo-600/20'
      : 'bg-slate-600/10 text-slate-700 dark:text-slate-300 ring-slate-600/20'
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ${cls}`}>{children}</span>
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
function StatusBadge({ status }: { status: Reservation['status'] }) {
  const map: Record<Reservation['status'], string> = {
    requested: 'bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300',
    accepted: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300',
    rejected: 'bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300',
    canceled: 'bg-slate-500/15 text-slate-700 ring-slate-500/30 dark:text-slate-300',
  }
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${map[status]}`}>{status}</span>
}
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: 'sm' | 'md' }
function PrimaryButton({ className = '', size = 'md', ...props }: BtnProps) {
  const sz = size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4'
  return (
    <button
      className={`${sz} rounded-xl font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      {...props}
    />
  )
}
function SecondaryButton({ className = '', size = 'md', ...props }: BtnProps) {
  const sz = size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4'
  return (
    <button
      className={`${sz} rounded-xl font-medium bg-slate-900/80 dark:bg-white/10 text-white hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      {...props}
    />
  )
}
function TertiaryButton({ className = '', size = 'md', ...props }: BtnProps) {
  const sz = size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4'
  return (
    <button
      className={`${sz} rounded-xl font-medium bg-slate-200/80 dark:bg-slate-800/60 hover:bg-slate-200 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      {...props}
    />
  )
}
function DangerButton({ className = '', size = 'md', ...props }: BtnProps) {
  const sz = size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4'
  return (
    <button
      className={`${sz} rounded-xl font-medium bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      {...props}
    />
  )
}

/* ---------- Reaction Bar ---------- */
type Item = { emoji: string; count: number; reactedByMe: boolean }

function ReactionBar({
  commentId,
  reactingId,
  setReactingId,
}: {
  commentId: string
  reactingId: string | null
  setReactingId: (id: string | null) => void
}) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await listCommentReactions(commentId)
        if (alive) {
          const normalized: Item[] = (data ?? []).map((d: any) => ({
            emoji: String(d.emoji),
            count: Number(d.count ?? 0),
            reactedByMe: Boolean(d.reactedByMe),
          }))
          setItems(normalized)
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [commentId])

  async function onToggle(emoji: string) {
    if (reactingId) return
    setReactingId(commentId)
    try {
      const { action } = await toggleReaction(commentId, emoji)
      setItems((prev): Item[] => {
        const idx = prev.findIndex(x => x.emoji === emoji)
        if (idx === -1) {
          return action === 'added'
            ? [...prev, { emoji, count: 1, reactedByMe: true }]
            : prev
        }
        const cur = prev[idx]! // non-null 단언
        const next: Item = { ...cur }
        if (action === 'added') {
          next.count = next.count + 1
          next.reactedByMe = true
        } else {
          next.count = Math.max(0, next.count - 1)
          next.reactedByMe = false
        }
        const arr: Item[] = [...prev]
        arr[idx] = next
        return arr.filter(x => x.count > 0)
      })
    } finally {
      setReactingId(null)
    }
  }

  const palette = ['👍', '😀', '🎉', '🔥', '⚽']

  return (
    <div className="mt-2 flex items-center gap-2">
      {palette.map(em => {
        const found = items.find(i => i.emoji === em)
        const active = !!found?.reactedByMe
        return (
          <button
            key={em}
            onClick={() => onToggle(em)}
            className={`h-7 px-2 rounded-full text-sm ring-1 transition-colors ${
              active
                ? 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 ring-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800 ring-slate-200/70 dark:ring-slate-700'
            }`}
          >
            <span className="mr-1">{em}</span>
            <span className="tabular-nums">{found?.count ?? 0}</span>
          </button>
        )
      })}
      {!loading && items.length === 0 && (
        <span className="text-xs text-slate-400">첫 반응을 남겨보세요!</span>
      )}
    </div>
  )
}
