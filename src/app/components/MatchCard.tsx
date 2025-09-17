import { Link } from 'react-router-dom'
import type { MatchPost } from '../../features/match/types'

export default function MatchCard({ post }: { post: MatchPost }) {
  return (
    <article className="card flex items-center justify-between">
      <div>
        <div className="text-sm opacity-80">{post.date} · {post.start_time}~{post.end_time}</div>
        <div className="text-lg font-semibold">{post.venue}</div>
        <div className="opacity-80 text-sm">{post.city ?? ''} · 레벨 {post.level ?? '미지정'} · {post.fee_split ?? ''}</div>
      </div>
      <Link className="btn" to={`/post/${post.id}`}>자세히</Link>
    </article>
  )
}
