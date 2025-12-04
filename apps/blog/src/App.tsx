import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@pei/ui'

// Pages
import Home from './pages/Home'
import PostView from './pages/PostView'
import Dashboard from './pages/Dashboard'
import CreatePost from './pages/CreatePost'
import EditPost from './pages/EditPost'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/post/:slug" element={<PostView />} />
        
        {/* Rotas de admin */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/post/new" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        <Route path="/admin/post/edit/:id" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

