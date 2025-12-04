import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@pei/database';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../card';
import { Alert, AlertDescription } from '../alert';
import { useLogin } from '../../hooks/useLogin';
import { Mail, Lock, AlertCircle, LogIn } from 'lucide-react';

// Schema de validação de senha (mesmo do PEI Collab)
const _passwordSchema = z.string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número');

interface LoginFormProps {
  appName: string;
  appLogo?: string;
  appSubtitle?: string;
  onSuccess?: () => void;
  redirectTo?: string;
  validateProfile?: boolean;
  requireSchoolId?: boolean;
  allowedRoles?: string[];
  showForgotPassword?: boolean;
  className?: string;
}

/**
 * Componente compartilhado de formulário de login
 * Inclui validação, rate limiting, SSO e background padronizado
 */
export function LoginForm({
  appName,
  appLogo,
  appSubtitle,
  onSuccess,
  redirectTo = '/',
  validateProfile = true,
  requireSchoolId = false,
  allowedRoles,
  showForgotPassword = false,
  className = '',
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  // Refs para garantir captura de valores (soluciona bug de preenchimento automático)
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const { login, loading, error } = useLogin({
    validateProfile,
    requireSchoolId,
    allowedRoles,
    onSuccess: () => {
      toast.success('Login realizado com sucesso!');
      // Usar setTimeout para garantir que o toast apareça antes do redirecionamento
      setTimeout(() => {
        if (onSuccess) {
          console.log('Chamando onSuccess callback');
          onSuccess();
        } else {
          console.log('Navegando para:', redirectTo);
          navigate(redirectTo, { replace: true });
        }
      }, 300);
    },
    onError: (_err) => {
      // Error já é tratado no hook
    },
  });

  // Verificar se já está autenticado ao montar o componente (apenas uma vez)
  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && session && window.location.pathname === '/login') {
        // Se já está autenticado e está na página de login, redirecionar
        navigate(redirectTo, { replace: true });
      }
    };

    checkSession();
    
    return () => {
      mounted = false;
    };
  }, []); // Executar apenas uma vez ao montar

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // Obter valores dos refs (soluciona bug de captura)
    const emailValue = emailRef.current?.value || email;
    const passwordValue = passwordRef.current?.value || password;

    await login(emailValue, passwordValue);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValue = emailRef.current?.value || email;
    
    if (!emailValue) {
      toast.error('Digite seu email para recuperar a senha');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: `${window.location.origin}/login?type=recovery`,
      });

      if (error) throw error;

      toast.success('Email enviado! Verifique sua caixa de entrada para redefinir sua senha.');
      setIsForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email de recuperação');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden p-4 ${className}`}>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1920&h=1080&fit=crop"
          alt="Professores e educadores em ambiente escolar"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/85 to-blue-900/90 backdrop-blur-[2px]" />
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md mx-auto shadow-2xl relative z-10 border-0 bg-white backdrop-blur-sm">
        <CardHeader className="space-y-4 p-6 pb-4">
          {appLogo && (
            <div className="flex justify-center mb-4">
              <img src={appLogo} alt={appName} className="h-20 w-auto object-contain" />
            </div>
          )}
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold" style={{ color: '#000000' }}>
              {isForgotPassword ? 'Recuperar Senha' : 'Entrar'}
            </CardTitle>
            {appSubtitle && (
              <CardDescription className="text-base font-semibold" style={{ color: '#000000' }}>
                {appSubtitle}
              </CardDescription>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="font-bold" style={{ color: '#000000' }}>
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    ref={emailRef}
                    id="forgot-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsForgotPassword(false)}
              >
                Voltar para login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold" style={{ color: '#000000' }}>
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    ref={emailRef}
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-bold" style={{ color: '#000000' }}>
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    ref={passwordRef}
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    className="pl-11"
                    required
                    autoComplete="current-password"
                  />
                </div>
                {passwordError && (
                  <p className="text-xs text-red-600">{passwordError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? (
                  'Entrando...'
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>

              {showForgotPassword && (
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm"
                  onClick={() => setIsForgotPassword(true)}
                >
                  Esqueceu sua senha?
                </Button>
              )}
            </form>
          )}

          <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-6">
            Use as mesmas credenciais do PEI Collab
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

