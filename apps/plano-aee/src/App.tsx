import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@pei/auth';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { ProtectedRoute } from '@pei/ui';
import Dashboard from './pages/Dashboard';
import CreatePlanoAEE from './pages/CreatePlanoAEE';
import EditPlanoAEE from './pages/EditPlanoAEE';
import ViewPlanoAEE from './pages/ViewPlanoAEE';
import Login from './pages/Login';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <Toaster position="top-right" richColors />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><CreatePlanoAEE /></ProtectedRoute>} />
              <Route path="/edit/:id" element={<ProtectedRoute><EditPlanoAEE /></ProtectedRoute>} />
              <Route path="/view/:id" element={<ProtectedRoute><ViewPlanoAEE /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

