import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@pei/ui'
import DashboardPlanejamento from './pages/DashboardPlanejamento'
import PlanosCurso from './pages/PlanosCurso'
import CriarPlanoCurso from './pages/CriarPlanoCurso'
import PlanosAula from './pages/PlanosAula'
import CriarPlanoAula from './pages/CriarPlanoAula'
import BibliotecaAtividades from './pages/BibliotecaAtividades'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPlanejamento /></ProtectedRoute>} />
        <Route path="/planos-curso" element={<ProtectedRoute><PlanosCurso /></ProtectedRoute>} />
        <Route path="/planos-curso/novo" element={<ProtectedRoute><CriarPlanoCurso /></ProtectedRoute>} />
        <Route path="/planos-aula" element={<ProtectedRoute><PlanosAula /></ProtectedRoute>} />
        <Route path="/planos-aula/novo" element={<ProtectedRoute><CriarPlanoAula /></ProtectedRoute>} />
        <Route path="/biblioteca-atividades" element={<ProtectedRoute><BibliotecaAtividades /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

