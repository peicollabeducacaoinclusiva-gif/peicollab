import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import StudentDetail from './pages/StudentDetail';
import Attendance from './pages/Attendance';
import Grades from './pages/Grades';
import Enrollments from './pages/Enrollments';
import Documents from './pages/Documents';
import MyWeek from './pages/MyWeek';

/**
 * Rotas do Portal Responsável (acesso familiar)
 */
export function PortalResponsavelRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="aluno/:id" element={<StudentDetail />} />
      <Route path="frequencia" element={<Attendance />} />
      <Route path="notas" element={<Grades />} />
      <Route path="matriculas" element={<Enrollments />} />
      <Route path="documentos" element={<Documents />} />
      <Route path="semana" element={<MyWeek />} />
    </Routes>
  );
}

