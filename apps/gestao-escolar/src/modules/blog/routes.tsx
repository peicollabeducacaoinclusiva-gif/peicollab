import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';

/**
 * Rotas do módulo Blog (Admin)
 */
export function BlogAdminRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="criar" element={<CreatePost />} />
      <Route path="editar/:id" element={<EditPost />} />
    </Routes>
  );
}

