import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type Toast = { id: number; message: string }
type Ctx = { push: (message: string) => void }
const ToastCtx = createContext<Ctx | null>(null)

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([])
  const push = useCallback((message: string) => {
    const id = Date.now() + Math.random()
    setList(prev => [...prev, { id, message }])
    setTimeout(() => setList(prev => prev.filter(t => t.id !== id)), 2500)
  }, [])
  const ctx = useMemo(() => ({ push }), [push])

  return (
    <ToastCtx.Provider value={ctx}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {list.map(t => (
          <div key={t.id} className="rounded-xl bg-slate-900 text-white/95 px-4 py-2 shadow-lg ring-1 ring-white/10">
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const v = useContext(ToastCtx)
  if (!v) throw new Error('useToast must be used within <ToastProvider>')
  return v
}
