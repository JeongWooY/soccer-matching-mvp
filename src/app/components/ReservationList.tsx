import { useEffect, useState } from 'react';
import { getReservationsByPost, type Reservation } from '../../features/match/api/getReservationsByPost';
import ReservationAdmin from './ReservationAdmin';

export default function ReservationList({ postId }: { postId: string }) {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      console.log('[ReservationList] load for postId=', postId);
      const data = await getReservationsByPost(postId);
      console.log('[ReservationList] fetched', data);
      setItems(data);
    } catch (e: any) {
      console.error('[ReservationList] error', e);
      setError(e.message ?? '에러');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setLoading(true); setError(null); setItems([]); load(); }, [postId]);

  if (loading) return <div>예약 목록 불러오는 중… (postId: {postId})</div>;
  if (error) return <div className="card">예약 목록 에러: {error} (postId: {postId})</div>;

  if (items.length === 0) return <div className="card">아직 예약 신청이 없어요. (postId: {postId})</div>;

  return (
    <div className="space-y-2">
      <div className="text-sm opacity-70">총 {items.length}건</div>
      {items.map(r => (
        <div key={r.id} className="card">
          <div className="text-sm opacity-80">상태: {r.status}</div>
          <div>메시지: {r.message ?? '-'}</div>
          <div className="text-sm opacity-60">
            신청 팀: {r.requester_team_id ?? '(익명/미지정)'} · post_id: {r.post_id}
          </div>

               <ReservationAdmin item={r} onUpdated={load} />

        </div>
      ))}
    </div>
  );
}
