import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { supabase } from '../../lib/supabase'
import { useToast } from '../components/toast/ToastProvider'

type Team = {
  id: string
  name: string
  region: string | null
  bio: string | null
  created_by: string | null
  created_at: string
  members?: number
}

export default function TeamPage() {
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()

  const [tab, setTab] = useState<'discover' | 'mine'>('discover')
  const [q, setQ] = useState('')
  const [openCreate, setOpenCreate] = useState(false)

  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const PAGE_SIZE = 9
  const [pageIndex, setPageIndex] = useState(0)
  const [total, setTotal] = useState(0)

  const toMessage = (e: unknown) => {
    if (e instanceof Error) return e.message
    if (typeof e === 'string') return e
    try { return JSON.stringify(e) } catch { return '알 수 없는 오류가 발생했습니다.' }
  }

  async function mergeMemberCounts(list: Team[]) {
  if (list.length === 0) return list
  const ids = list.map(t => t.id)
  const { data: counts, error: ce } = await supabase
    .from('team_member_counts')
    .select('team_id, member_count')
    .in('team_id', ids)
  if (ce) throw ce
  const map = new Map<string, number>()
  ;(counts ?? []).forEach((row: any) => map.set(row.team_id, row.member_count))
  return list.map(t => ({ ...t, members: map.get(t.id) ?? 0 }))
}

  // 첫 로드
  useEffect(() => { void loadFirst() }, [])

async function loadFirst() {
  try {
    setLoading(true)
    const { data, error, count } = await supabase
      .from('teams')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1)

    if (error) throw error
    const base = (data ?? []) as Team[]
    const merged = await mergeMemberCounts(base)
    setTeams(merged)
    setTotal(count ?? base.length ?? 0)
    setPageIndex(0)
    setError(null)
  } catch (e) {
    setError(toMessage(e))
  } finally {
    setLoading(false)
  }
}

 async function loadMore() {
  if (loading || loadingMore) return
  if (teams.length >= total) return
  const from = (pageIndex + 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  try {
    setLoadingMore(true)
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)
    if (error) throw error
    const more = (data ?? []) as Team[]
    if (more.length === 0) return
    const merged = await mergeMemberCounts(more)
    setTeams(prev => [...prev, ...merged])
    setPageIndex(pi => pi + 1)
  } catch (e) {
    setError(toMessage(e))
  } finally {
    setLoadingMore(false)
  }
}

  // 스크롤로 더 불러오기
  useEffect(() => {
    function onScroll() {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200
      if (nearBottom) void loadMore()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [teams.length, total, loading, loadingMore])

  const myTeams = useMemo(
    () => teams.filter(t => t.created_by === user?.id),
    [teams, user?.id]
  )

  const visible = useMemo(() => {
    const base = tab === 'discover' ? teams : myTeams
    const keyword = q.trim().toLowerCase()
    if (!keyword) return base
    return base.filter(t =>
      [t.name, t.region ?? '', t.bio ?? ''].some(v =>
        v.toLowerCase().includes(keyword)
      )
    )
  }, [tab, teams, myTeams, q])

  // 생성
  async function handleCreateTeam(payload: { name: string; region: string; bio: string }) {
    if (!user) {
      push('로그인이 필요합니다.')
      return
    }
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: payload.name,
          region: payload.region || null,
          bio: payload.bio || null,
          created_by: user.id,
        })
        .select()
        .single()
      if (error) throw error
      setTeams(prev => [data as Team, ...prev])
      setTotal(t => t + 1)
      push('새 팀이 생성되었습니다.')
    } catch (e) {
      push(toMessage(e))
    }
  }

  // 삭제(내 팀만)
  async function handleDeleteTeam(id: string) {
    if (!confirm('이 팀을 삭제할까요?')) return
    try {
      const { error } = await supabase.from('teams').delete().eq('id', id)
      if (error) throw error
      setTeams(prev => prev.filter(t => t.id !== id))
      setTotal(t => Math.max(0, t - 1))
      push('삭제되었습니다.')
    } catch (e) {
      push(toMessage(e))
    }
  }

  // 초대 링크 복사 (상세 페이지로 이동하는 링크)
  async function copyInviteLink(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    e.preventDefault()
    const url = `${window.location.origin}/team/${id}`
    try {
      await navigator.clipboard.writeText(url)
      push('초대 링크가 복사되었습니다.')
    } catch {
      push('복사 실패. 주소창의 링크를 직접 공유해주세요.')
    }
  }

  return (
    <div className="grid gap-6">
      {/* 헤더 */}
      <div className="relative">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-teal-400 blur opacity-30" />
        <div className="relative rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 p-6 shadow-xl">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">팀 찾기 & 관리</h1>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                함께할 팀원 또는 함께할 팀을 찾아보세요.
              </span>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setOpenCreate(true)}
                  className="h-11 px-4 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  새 팀 만들기
                </button>
              </div>
            </div>

            {/* 탭 & 검색 */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                <TabButton active={tab === 'discover'} onClick={() => setTab('discover')}>
                  탐색 <Badge tone="indigo">{teams.length}</Badge>
                </TabButton>
                <TabButton active={tab === 'mine'} onClick={() => setTab('mine')}>
                  내 팀 <Badge tone="slate">{myTeams.length}</Badge>
                </TabButton>
              </div>

              <div className="flex-1">
                <div className="relative">
                  <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="팀 이름, 지역, 소개로 검색…"
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <GridSkeleton />
      ) : error ? (
        <ErrorBox message={error} />
      ) : visible.length === 0 ? (
        <EmptyState
          title="조건에 맞는 팀이 없어요"
          subtitle={tab === 'mine' ? '아직 만든 팀이 없네요. 새 팀을 만들어보세요!' : '검색어를 바꾸거나 새 팀을 만들어보세요.'}
          action={
            <button onClick={() => setOpenCreate(true)} className="mt-3 h-10 px-4 rounded-xl bg-slate-900/80 dark:bg-white/10 text-white">
              새 팀 만들기
            </button>
          }
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(t => (
            <li key={t.id} className="group relative rounded-3xl overflow-hidden">
              <Link to={`/team/${t.id}`} className="block">
                <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 via-sky-500 to-teal-400 blur opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative h-full rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 p-6 shadow-md hover:shadow-lg transition-shadow flex flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <h3 className="text-lg font-semibold line-clamp-1">{t.name}</h3>
                    <div className="ml-auto flex items-center gap-2">
                      <Badge tone="slate">{t.members ?? 1}명</Badge>
                      {t.created_by === user?.id && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); void handleDeleteTeam(t.id) }}
                          className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs"
                          title="삭제"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Chip icon="📍">{t.region ?? '지역 미정'}</Chip>
                    <Chip icon="📅">{new Date(t.created_at).toLocaleDateString()}</Chip>
                  </div>
                  {t.bio && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {t.bio}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-2">
                    <button
                      className="h-10 px-3 rounded-lg bg-slate-200/80 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm"
                      onClick={(e) => copyInviteLink(e, t.id)}
                    >
                      초대 링크
                    </button>
                    <button
                      className="h-10 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
                      onClick={(e) => { e.preventDefault(); navigate(`/team/${t.id}`) }}
                    >
                      참여 신청
                    </button>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* 더 보기 */}
      {!loading && teams.length < total && (
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

      {/* 생성 모달 */}
      <CreateTeamModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreate={async (payload) => {
          await handleCreateTeam(payload)
          setOpenCreate(false)
        }}
      />
    </div>
  )
}

/* ───────────── 작은 컴포넌트들 ───────────── */

function GridSkeleton() {
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
      <div className="text-sm text-red-600/90 dark:text-red-300/90 mt-1 whitespace-pre-wrap break-all">{message}</div>
    </div>
  )
}

function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-10 text-center">
      <div className="text-lg font-semibold">{title}</div>
      {subtitle && <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</div>}
      {action}
    </div>
  )
}

function TabButton({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/40'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="inline-flex items-center gap-2">{children}</span>
    </button>
  )
}

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

/* ───────────── 생성 모달 ───────────── */

function CreateTeamModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (team: { name: string; region: string; bio: string }) => void
}) {
  const [name, setName] = useState('')
  const [region, setRegion] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setName(''); setRegion(''); setBio(''); setErr(null) }
  }, [open])

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setErr('팀 이름을 입력해주세요.'); return }
    try {
      setSaving(true)
      await onCreate({ name: name.trim(), region: region.trim(), bio: bio.trim() })
    } catch (e) {
      setErr(e instanceof Error ? e.message : '생성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-3">새 팀 만들기</h3>
        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">팀 이름</span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-11 rounded-xl px-4 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="예: FC Morning"
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">지역</span>
            <input
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="h-11 rounded-xl px-4 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="예: 서울 송파"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">팀 소개</span>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="min-h-[100px] rounded-xl px-4 py-3 bg-white/70 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              placeholder="간단한 팀 소개를 적어주세요."
            />
          </label>
          {err && <div className="text-sm text-rose-500">{err}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="h-11 px-4 rounded-xl bg-slate-200/70 dark:bg-slate-800/60">
              취소
            </button>
            <button type="submit" disabled={saving} className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white">
              {saving ? '만드는 중…' : '만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
