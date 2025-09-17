import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { useToast } from '../components/toast/ToastProvider'
import { supabase } from '../../lib/supabase'
import { cancelTeamRequest } from '../../features/teams/cancelRequest'

type Row = {
  id: string
  team_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  team?: { id: string; name: string | null } | null  // ✅ 단일 객체로 변경
}

export default function MyTeamRequests() {
  const { user } = useAuth()
  const { push } = useToast()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function toMsg(e: unknown) {
    if (e instanceof Error) return e.message
    if (typeof e === 'string') return e
    try { return JSON.stringify(e) } catch { return '알 수 없는 오류' }
  }

 useEffect(() => {
  if (!user?.id) { setLoading(false); return }
  ;(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('team_requests')
        .select('id, team_id, status, created_at, team:teams(id, name)')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error

      // 🔧 team이 배열로 올 수도 있으므로 첫 원소를 꺼내 단일 객체로 정규화
      const normalized = (data ?? []).map((r: any) => ({
        ...r,
        team: Array.isArray(r.team) ? (r.team[0] ?? null) : (r.team ?? null),
      }))

      // 타입 단언 전에 unknown 거쳐서 TS2352 경고 방지
      setRows(normalized as unknown as Row[])
      setError(null)
    } catch (e) {
      setError(toMsg(e))
    } finally {
      setLoading(false)
    }
  })()
}, [user?.id])

  async function handleCancel(id: string) {
    try {
      await cancelTeamRequest(id)
      push('요청을 취소했습니다.')
      setRows(prev => prev.filter(r => r.id !== id))
    } catch (e) {
      push(toMsg(e))
    }
  }

  if (!user) return <GuardCard />
  if (loading) return <Skeleton />
  if (error) return <ErrorBox message={error} />

  return (
    <div className="grid gap-6">
      <HeaderCard title="내 팀 참여 요청">
        내가 보낸 참여 요청의 상태를 확인하고, 대기 중인 요청은 취소할 수 있어요.
      </HeaderCard>

      {rows.length === 0 ? (
        <EmptyCard title="보낸 요청이 없습니다." action={<LinkBtn to="/team">팀 탐색하기</LinkBtn>} />
      ) : (
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4">
          <ul className="grid gap-2">
            {rows.map(r => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-slate-800 p-3">
                <div className="text-sm">
                  <Link to={`/team/${r.team_id}`} className="font-medium underline underline-offset-2">
                    {r.team?.name ?? r.team_id.slice(0, 8)} {/* ✅ r.team 사용 */}
                  </Link>
                  <span className="ml-2">{r.status}</span>
                  <span className="text-slate-500 ml-2">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                {r.status === 'pending' ? (
                  <button
                    onClick={() => handleCancel(r.id)}
                    className="h-9 px-3 rounded-lg bg-slate-200/80 dark:bg-slate-800/60 text-sm"
                  >
                    취소
                  </button>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full ring-1 ring-slate-300 dark:ring-slate-700">
                    완료
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* UI helpers */
function HeaderCard({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-teal-400 blur opacity-30" />
      <div className="relative rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          {children && <p className="text-slate-600 dark:text-slate-300 text-sm">{children}</p>}
        </div>
      </div>
    </div>
  )
}
function Skeleton(){return(<div className="grid gap-4"><div className="h-36 rounded-3xl bg-slate-200/60 dark:bg-slate-800/40 animate-pulse"/><div className="h-60 rounded-2xl bg-slate-200/50 dark:bg-slate-800/30 animate-pulse"/></div>)}
function ErrorBox({ message }: { message: string }){return(<div className="rounded-2xl border border-red-200/60 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4"><div className="text-red-700 dark:text-red-300 font-medium">문제가 발생했습니다</div><div className="text-sm text-red-600/90 dark:text-red-300/90 mt-1 whitespace-pre-wrap break-all">{message}</div></div>)}
function EmptyCard({ title, action }: { title: string; action?: React.ReactNode }){return(<div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-10 text-center"><div className="text-lg font-semibold">{title}</div>{action && <div className="mt-3">{action}</div>}</div>)}
function GuardCard(){return(<div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-10 text-center"><div className="text-lg font-semibold">로그인이 필요합니다.</div></div>)}
function LinkBtn({ to, children }: { to: string; children: React.ReactNode }){return(<Link to={to} className="inline-flex h-10 px-3 items-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm">{children}</Link>)}
