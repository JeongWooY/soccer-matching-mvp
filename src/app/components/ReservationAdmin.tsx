import { useState } from 'react';
import { updateReservationStatus } from '../../features/match/api/updateReservationStatus';
import type { Reservation } from '../../features/match/api/getReservationsByPost';

export default function ReservationAdmin({ item, onUpdated }: {
  item: Reservation; onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (status: 'accepted' | 'rejected') => {
    try {
      setLoading(true);
      console.log('update reservation', item.id, '→', status); // 디버그
      await updateReservationStatus(item.id, status);
      alert(`예약이 ${status === 'accepted' ? '수락' : '거절'}되었습니다.`);
      onUpdated(); // 목록 재로딩
    } catch (e: any) {
      console.error('updateReservationStatus error', e);
      alert(e.message ?? '에러 발생');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 mt-2">
      <button className="btn" disabled={loading} onClick={() => handleUpdate('accepted')}>수락</button>
      <button className="btn bg-red-500 text-white" disabled={loading} onClick={() => handleUpdate('rejected')}>거절</button>
    </div>
  );
}
