import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@pei/ui'
import DashboardAtividades from './pages/DashboardAtividades'
import ExplorarAtividades from './pages/ExplorarAtividades'
import CriarAtividade from './pages/CriarAtividade'
import MinhasAtividades from './pages/MinhasAtividades'
import AtividadesFavoritas from './pages/AtividadesFavoritas'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardAtividades /></ProtectedRoute>} />
        <Route path="/explorar" element={<ProtectedRoute><ExplorarAtividades /></ProtectedRoute>} />
        <Route path="/criar" element={<ProtectedRoute><CriarAtividade /></ProtectedRoute>} />
        <Route path="/minhas-atividades" element={<ProtectedRoute><MinhasAtividades /></ProtectedRoute>} />
        <Route path="/favoritas" element={<ProtectedRoute><AtividadesFavoritas /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

