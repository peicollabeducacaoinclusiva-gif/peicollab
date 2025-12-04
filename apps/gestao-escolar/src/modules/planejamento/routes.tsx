import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPlanejamento from './pages/DashboardPlanejamento';
import CriarPlanoAula from './pages/CriarPlanoAula';
import CriarPlanoCurso from './pages/CriarPlanoCurso';
import PlanosAula from './pages/PlanosAula';
import PlanosCurso from './pages/PlanosCurso';
import BibliotecaAtividades from './pages/BibliotecaAtividades';

/**
 * Rotas do módulo Planejamento Pedagógico
 */
export function PlanejamentoRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPlanejamento />} />
      <Route path="aulas/criar" element={<CriarPlanoAula />} />
      <Route path="aulas" element={<PlanosAula />} />
      <Route path="cursos/criar" element={<CriarPlanoCurso />} />
      <Route path="cursos" element={<PlanosCurso />} />
      <Route path="biblioteca" element={<BibliotecaAtividades />} />
    </Routes>
  );
}

