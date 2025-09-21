import { createBrowserRouter } from 'react-router-dom'

// 여기! routes 폴더 바깥의 App.tsx라서 ../App
import App from '../App'

// 여기! 같은 폴더에 있으니 ./Home 처럼 상대경로
import Home from './Home'
import PostDetail from './PostDetail'
import PostNew from './PostNew'
import TeamPage from './TeamPage'
import Me from './Me'
import Login from './Login'
import Signup from './Signup'
import TeamDetail from './TeamDetail'
import MyInvites from './MyInvites'
import MyTeamRequests from './MyTeamRequests'
// '@' 별칭을 안 쓴다면 상대경로로
import RequireAuth from '../../features/auth/RequireAuth'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'post/:id', element: <PostDetail /> },
      { path: 'team', element: <TeamPage /> },
      { path: 'team/:id', element: <TeamDetail /> },
      { path: 'me', element: <RequireAuth><Me /></RequireAuth> },
      { path: 'post/new', element: <RequireAuth><PostNew /></RequireAuth> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      { path: 'team/invites', element: <RequireAuth><MyInvites /></RequireAuth> },   // ✅ 추가
      { path: 'team/requests', element: <RequireAuth><MyTeamRequests /></RequireAuth> },
    ],
  },
])
