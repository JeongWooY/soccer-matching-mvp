import { useParams } from 'react-router-dom'

export default function PostDetail() {
  const { id } = useParams()
  return <div className="card">게시글 상세: {id} (추가 구현 예정)</div>
}
