import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardAtividades from './pages/DashboardAtividades';
import CriarAtividade from './pages/CriarAtividade';
import MinhasAtividades from './pages/MinhasAtividades';
import ExplorarAtividades from './pages/ExplorarAtividades';
import AtividadesFavoritas from './pages/AtividadesFavoritas';

/**
 * Rotas do módulo Atividades
 */
export function AtividadesRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardAtividades />} />
      <Route path="criar" element={<CriarAtividade />} />
      <Route path="minhas" element={<MinhasAtividades />} />
      <Route path="explorar" element={<ExplorarAtividades />} />
      <Route path="favoritas" element={<AtividadesFavoritas />} />
    </Routes>
  );
}

