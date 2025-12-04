import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@pei/auth';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { ProtectedRoute } from '@pei/ui';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

// Lazy loading para melhor performance
const Menus = lazy(() => import('./pages/Menus'));
const Planning = lazy(() => import('./pages/Planning'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Reports = lazy(() => import('./pages/Reports'));

// Componente de loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

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
              <Route
                path="/menus"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Menus />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/planning"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Planning />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/suppliers"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Suppliers />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Attendance />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/purchases"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Purchases />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Reports />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
