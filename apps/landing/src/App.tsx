import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import Home from './pages/Home';
import SelectNetwork from './pages/SelectNetwork';
import About from './pages/About';
import Login from './pages/Login';
import AppSelector from './pages/AppSelector';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/apps" element={<AppSelector />} />
          <Route path="/redes" element={<SelectNetwork />} />
          <Route path="/sobre" element={<About />} />
          {/* Redirecionar rotas antigas */}
          <Route path="/entrar" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

