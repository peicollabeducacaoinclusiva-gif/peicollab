import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Planning from './pages/Planning';
import Menus from './pages/Menus';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';

/**
 * Rotas do módulo Merenda Escolar
 */
export function MerendaRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="planejamento" element={<Planning />} />
      <Route path="cardapios" element={<Menus />} />
      <Route path="fornecedores" element={<Suppliers />} />
      <Route path="compras" element={<Purchases />} />
      <Route path="frequencia" element={<Attendance />} />
      <Route path="relatorios" element={<Reports />} />
    </Routes>
  );
}

