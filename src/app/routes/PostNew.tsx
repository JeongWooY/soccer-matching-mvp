import { useState } from 'react'
import { createMatchPost } from '@/features/match/api/createMatchPost'

export default function PostNew() {
  const [form, setForm] = useState({
    date: '', start: '', end: '', venue: '', city: '', level: '중', fee_split: '반반', openchat_url: ''
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMatchPost({
        date: form.date,
        start_time: form.start,
        end_time: form.end,
        venue: form.venue,
        city: form.city || null,
        level: form.level || null,
        fee_split: form.fee_split || null,
        openchat_url: form.openchat_url || null
      })
      alert('등록 완료!')
      window.location.href = '/'
    } catch (err:any) {
      alert(err.message || '오류가 발생했습니다.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-xl">
      <div><div className="label">날짜</div><input className="input" placeholder="YYYY-MM-DD" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
      <div><div className="label">시작</div><input className="input" placeholder="19:00" value={form.start} onChange={e=>setForm({...form, start:e.target.value})} /></div>
      <div><div className="label">종료</div><input className="input" placeholder="21:00" value={form.end} onChange={e=>setForm({...form, end:e.target.value})} /></div>
      <div><div className="label">구장</div><input className="input" placeholder="○○체육공원" value={form.venue} onChange={e=>setForm({...form, venue:e.target.value})} /></div>
      <div><div className="label">도시/구</div><input className="input" placeholder="서울 ○○구" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} /></div>
      <div><div className="label">레벨</div>
        <select className="select" value={form.level} onChange={e=>setForm({...form, level:e.target.value})}>
          <option>하</option><option>중</option><option>상</option>
        </select>
      </div>
      <div><div className="label">분담</div>
        <select className="select" value={form.fee_split} onChange={e=>setForm({...form, fee_split:e.target.value})}>
          <option>반반</option><option>전액 부담</option><option>기타</option>
        </select>
      </div>
      <div><div className="label">오픈채팅 링크</div><input className="input" placeholder="https://open.kakao.com/..." value={form.openchat_url} onChange={e=>setForm({...form, openchat_url:e.target.value})} /></div>
      <button className="btn">등록</button>
    </form>
  )
}
