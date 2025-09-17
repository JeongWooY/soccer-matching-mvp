import { Outlet, Link } from 'react-router-dom'

export default function App() {
  return (
    <div className="container py-6 space-y-6">
      <header className="flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">풋살 매칭 MVP</Link>
        <nav className="space-x-3">
          <Link className="btn" to="/post/new">매칭글 등록</Link>
          <Link className="btn" to="/me">내 정보</Link>
        </nav>
      </header>
      <Outlet />
      <footer className="opacity-60 text-sm py-6">© {new Date().getFullYear()} 풋살 매칭</footer>
    </div>
  )
}
