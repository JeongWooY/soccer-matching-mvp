import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { supabase } from '../../lib/supabase'

type Row = {
  id: string
  team_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  team: { id: string; name: string | null } | null
}

export default function MyTeamRequests() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const toMsg = (e: unknown) =>
    e instanceof Error ? e.message : typeof e === 'string' ? e : '알 수 없는 오류'

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    ;(async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('team_requests')
          .select('id,team_id,status,created_at, team:teams(id,name)')
          .eq('requester_id', user.id)
          .order('created_at', { ascending: false })
        if (error) throw error
        const normalized: Row[] = (data ?? []).map((r: any) => ({
          id: r.id,
          team_id: r.team_id,
          status: r.status,
          created_at: r.created_at,
          team: Array.isArray(r.team) ? (r.team[0] ?? null) : (r.team ?? null),
        }))
        setRows(normalized)
        setError(null)
      } catch (e) { setError(toMsg(e)) }
      finally { setLoading(false) }
    })()
  }, [user?.id])

  if (!user) return <GuardCard />
  if (loading) return <Skeleton />
  if (error) return <ErrorBox message={error} />

  return (
    <div className="grid gap-6">
      <HeaderCard title="내 참여 요청">내가 팀에 보낸 가입 요청 목록이에요.</HeaderCard>
      {rows.length === 0 ? (
        <EmptyCard title="보낸 요청이 없습니다." action={<LinkBtn to="/team">팀 탐색하기</LinkBtn>} />
      ) : (
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4">
          <ul className="grid gap-2">
            {rows.map(r => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-slate-800 p-3">
                <div className="text-sm">
                  <Link to={`/team/${r.team_id}`} className="font-medium underline underline-offset-2">
                    {r.team?.name ?? r.team_id.slice(0, 8)}
                  </Link>
                  <span className="ml-2">{r.status}</span>
                  <span className="text-slate-500 ml-2">{new Date(r.created_at).toLocaleString()}</span>
                </div>
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
