import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import Home from './Home'
import PostNew from './PostNew'
import PostDetail from './PostDetail'
import TeamPage from './TeamPage'
import Me from './Me'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'post/new', element: <PostNew /> },
      { path: 'post/:id', element: <PostDetail /> },
      { path: 'team/:id', element: <TeamPage /> },
      { path: 'me', element: <Me /> },
    ]
  }
])
