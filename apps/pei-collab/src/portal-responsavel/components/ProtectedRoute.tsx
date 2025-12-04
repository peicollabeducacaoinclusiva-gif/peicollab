import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Verificar se há token na URL ou localStorage
      const urlParams = new URLSearchParams(location.search);
      const token = urlParams.get('token') || localStorage.getItem('family_token');
      
      if (!token) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      // Validar token via RPC
      const { data, error } = await supabase.rpc('validate_family_token_secure', {
        _token: token,
        _ip_address: null,
      });

      if (error || !data || !data.valid) {
        localStorage.removeItem('family_token');
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      // Token válido - salvar e autenticar
      localStorage.setItem('family_token', token);
      setAuthenticated(true);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setAuthenticated(false);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

