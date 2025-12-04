import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentDetail from './pages/StudentDetail';
import Attendance from './pages/Attendance';
import Grades from './pages/Grades';
import Documents from './pages/Documents';
import Enrollments from './pages/Enrollments';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/students/:id" element={<ProtectedRoute><StudentDetail /></ProtectedRoute>} />
        <Route path="/students/:id/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
        <Route path="/students/:id/grades" element={<ProtectedRoute><Grades /></ProtectedRoute>} />
        <Route path="/students/:id/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path="/enrollments" element={<ProtectedRoute><Enrollments /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

