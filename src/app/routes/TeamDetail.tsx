import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { useToast } from '../components/toast/ToastProvider'
import { supabase } from '../../lib/supabase'

import { Team, TeamMember, TeamInvitation, TeamRequest } from '../../features/teams/types'
import { listTeamMembers } from '../../features/teams/listTeamMembers'
import { requestJoinTeam } from '../../features/teams/requestJoinTeam'
import { respondRequest } from '../../features/teams/respondRequest'
import { listRequests } from '../../features/teams/listRequests'
import { listInvitations } from '../../features/teams/listInvitations'
import { sendInvitation } from '../../features/teams/sendInvitation'
import type { ReactNode } from 'react'

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { push } = useToast()

  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [requests, setRequests] = useState<TeamRequest[]>([])
  const [invites, setInvites] = useState<TeamInvitation[]>([])
  const [tab, setTab] = useState<'members' | 'requests' | 'invites'>('members')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isOwner = useMemo(() => !!(team && user?.id && team.created_by === user.id), [team, user?.id])
  const isMember = useMemo(() => members.some(m => m.user_id === user?.id), [members, user?.id])
  const myPendingRequest = useMemo(
    () => requests.find(r => r.requester_id === user?.id && r.status === 'pending'),
    [requests, user?.id]
  )

  function toMsg(e: unknown) {
    if (e instanceof Error) return e.message
    if (typeof e === 'string') return e
    try { return JSON.stringify(e) } catch { return '알 수 없는 오류' }
  }

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        setLoading(true)
        // 팀 정보
        const { data: t, error: te } = await supabase
          .from('teams')
          .select('*')
          .eq('id', id)
          .single()
        if (te) throw te
        setTeam(t as Team)

        // 멤버/요청/초대
        const [ms, rs, is] = await Promise.all([
          listTeamMembers(id),
          listRequests(id),
          isOwnerGuess(t as Team, user?.id) ? listInvitations(id) : Promise.resolve([]),
        ])
        setMembers(ms as TeamMember[])
        setRequests(rs as TeamRequest[])
        setInvites(is as TeamInvitation[])
        setError(null)
      } catch (e) {
        setError(toMsg(e))
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id])

  function isOwnerGuess(t: Team, uid?: string | null) {
    return !!(t && uid && t.created_by === uid)
  }

  async function handleJoin() {
    if (!id || !user) { push('로그인이 필요합니다.'); return }
    try {
      await requestJoinTeam(id, user.id)
      push('참여 요청을 보냈습니다.')
      const rs = await listRequests(id)
      setRequests(rs as TeamRequest[])
    } catch (e) {
      push(toMsg(e))
    }
  }

  async function handleRespond(reqId: string, action: 'accepted' | 'rejected') {
    try {
      await respondRequest(reqId, action)
      push(action === 'accepted' ? '요청을 수락했습니다.' : '요청을 거절했습니다.')
      const [ms, rs] = await Promise.all([listTeamMembers(id!), listRequests(id!)])
      setMembers(ms as TeamMember[])
      setRequests(rs as TeamRequest[])
    } catch (e) {
      push(toMsg(e))
    }
  }

  async function handleInvite(email: string) {
    if (!id || !user) return
    try {
      await sendInvitation(id, email, user.id)
      push('초대를 보냈습니다.')
      const is = await listInvitations(id)
      setInvites(is as TeamInvitation[])
    } catch (e) {
      push(toMsg(e))
    }
  }

  if (loading) return <PageSkeleton />
  if (error) return <ErrorBox message={error} />
  if (!team) return <ErrorBox message="팀을 찾을 수 없습니다." />

  return (
    <div className="grid gap-6">
      {/* 헤더 */}
      <div className="relative">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-teal-400 blur opacity-30" />
        <div className="relative rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 p-6 shadow-xl">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <div className="ml-auto flex gap-2">
                <Link to="/team" className="h-10 px-3 rounded-lg bg-slate-200/80 dark:bg-slate-800/60 text-sm flex items-center">목록</Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Chip icon="📍">{team.region ?? '지역 미정'}</Chip>
              <Chip icon="📅">{new Date(team.created_at).toLocaleDateString()}</Chip>
              {isOwner && <Badge tone="indigo">내가 만든 팀</Badge>}
            </div>
            {team.bio && <p className="text-slate-700 dark:text-slate-300">{team.bio}</p>}

            {/* 참여 버튼 (오너X, 멤버X) */}
            {!isOwner && !isMember && user && (
              <div className="pt-1">
                {myPendingRequest ? (
                  <span className="text-sm text-slate-500">내 참여요청 상태: {myPendingRequest.status}</span>
                ) : (
                  <button onClick={handleJoin} className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white">
                    이 팀에 참여 요청 보내기
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 w-fit">
        <TabButton active={tab === 'members'} onClick={() => setTab('members')}>
          멤버 <Badge tone="slate">{members.length}</Badge>
        </TabButton>
        <TabButton active={tab === 'requests'} onClick={() => setTab('requests')} disabled={!isOwner}>
          요청 관리
        </TabButton>
        <TabButton active={tab === 'invites'} onClick={() => setTab('invites')} disabled={!isOwner}>
          초대
        </TabButton>
      </div>

      {/* 내용 */}
      {tab === 'members' && (
        <Card>
          {members.length === 0 ? (
            <EmptyRow text="아직 멤버가 없어요." />
          ) : (
            <ul className="grid gap-2">
              {members.map(m => (
                <li key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-slate-800 p-3">
                  <div className="text-sm">
                    <span className="font-medium">{m.user_id.slice(0, 8)}</span>
                    <span className="text-slate-500 ml-2">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <Badge tone={m.role === 'owner' ? 'indigo' : 'slate'}>{m.role}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'requests' && (
        <Card>
          {!isOwner ? (
            <EmptyRow text="요청 관리는 팀 오너만 볼 수 있어요." />
          ) : requests.length === 0 ? (
            <EmptyRow text="대기 중인 요청이 없습니다." />
          ) : (
            <ul className="grid gap-2">
              {requests.map(r => (
                <li key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-slate-800 p-3">
                  <div className="text-sm">
                    <span className="font-medium">{r.requester_id.slice(0, 8)}</span>
                    <span className="ml-2">{r.status}</span>
                    <span className="text-slate-500 ml-2">{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  {r.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleRespond(r.id, 'accepted')} className="h-9 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">수락</button>
                      <button onClick={() => handleRespond(r.id, 'rejected')} className="h-9 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm">거절</button>
                    </div>
                  ) : (
                    <Badge tone="slate">{r.status}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'invites' && (
        <Card>
          {!isOwner ? (
            <EmptyRow text="초대 관리는 팀 오너만 볼 수 있어요." />
          ) : (
            <>
              <InviteForm onInvite={handleInvite} />
              <div className="mt-4">
                {invites.length === 0 ? (
                  <EmptyRow text="보낸 초대가 없습니다." />
                ) : (
                  <ul className="grid gap-2">
                    {invites.map(i => (
                      <li key={i.id} className="flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-slate-800 p-3">
                        <div className="text-sm">
                          <span className="font-medium">{i.invited_email}</span>
                          <span className="ml-2">{i.status}</span>
                          <span className="text-slate-500 ml-2">{new Date(i.created_at).toLocaleString()}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}

/* ----- 작은 컴포넌트 ----- */

function PageSkeleton(){
  return (
    <div className="grid gap-4">
      <div className="h-36 rounded-3xl bg-slate-200/60 dark:bg-slate-800/40 animate-pulse"/>
      <div className="h-60 rounded-2xl bg-slate-200/50 dark:bg-slate-800/30 animate-pulse"/>
    </div>
  )
}

function ErrorBox({ message }: { message: string }){
  return (
    <div className="rounded-2xl border border-red-200/60 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4">
      <div className="text-red-700 dark:text-red-300 font-medium">문제가 발생했습니다</div>
      <div className="text-sm text-red-600/90 dark:text-red-300/90 mt-1 whitespace-pre-wrap break-all">{message}</div>
    </div>
  )
}

function EmptyRow({ text }: { text: string }){
  return <div className="text-sm text-slate-500 dark:text-slate-400">{text}</div>
}

function Card({ children }: { children: ReactNode }){
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4">
      {children}
    </div>
  )
}

/* ✅ 누락돼서 에러났던 TabButton */
function TabButton({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-white dark:bg-slate-900 shadow-sm'
          : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/40'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="inline-flex items-center gap-2">{children}</span>
    </button>
  )
}

/* ✅ children 타입 명시 */
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

/* ✅ 초대 폼 */
function InviteForm({ onInvite }: { onInvite: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    try {
      setBusy(true)
      await onInvite(email.trim())
      setEmail('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-[1fr_auto] gap-2">
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="h-11 rounded-xl px-4 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="example@email.com 으로 초대"
      />
      <button disabled={busy} className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white">
        {busy ? '전송 중…' : '초대 보내기'}
      </button>
    </form>
  )
}

