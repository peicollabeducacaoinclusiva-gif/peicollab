import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RoutesPage from './pages/Routes';
import Vehicles from './pages/Vehicles';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';

/**
 * Rotas do módulo Transporte Escolar
 */
export function TransporteRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="rotas" element={<RoutesPage />} />
      <Route path="veiculos" element={<Vehicles />} />
      <Route path="alunos" element={<Students />} />
      <Route path="frequencia" element={<Attendance />} />
      <Route path="relatorios" element={<Reports />} />
    </Routes>
  );
}

