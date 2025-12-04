import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreatePlanoAEE from './pages/CreatePlanoAEE';
import EditPlanoAEE from './pages/EditPlanoAEE';
import ViewPlanoAEE from './pages/ViewPlanoAEE';

/**
 * Rotas do módulo Plano AEE
 */
export function PlanoAEERoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="criar" element={<CreatePlanoAEE />} />
      <Route path="editar/:id" element={<EditPlanoAEE />} />
      <Route path="visualizar/:id" element={<ViewPlanoAEE />} />
    </Routes>
  );
}


