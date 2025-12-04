import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@pei/database';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Label, Alert, AlertDescription } from '@pei/ui';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!token.trim()) {
        throw new Error('Informe o código de acesso');
      }

      if (!dateOfBirth.trim()) {
        throw new Error('Informe a data de nascimento do aluno');
      }

      // Validar token via Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('validate-family-access', {
        body: {
          code: token.toUpperCase().trim(),
          dateOfBirth: dateOfBirth.trim(),
          clientIp: 'web-app',
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Erro ao validar acesso');
      }

      if (data?.blocked) {
        throw new Error('Muitas tentativas. Aguarde 15 minutos e tente novamente.');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success || !data?.peiId) {
        throw new Error('Código inválido ou expirado');
      }

      // Salvar token e redirecionar
      localStorage.setItem('family_token', token.toUpperCase().trim());
      
      toast.success('Acesso autorizado! Redirecionando...');

      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
      toast.error(err.message || 'Verifique os dados e tente novamente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1920&h=1080&fit=crop"
          alt="Professores e educadores em ambiente escolar"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/85 to-blue-900/90 backdrop-blur-[2px]" />
      </div>

      <Card className="w-full max-w-md mx-auto shadow-2xl relative z-10 border-0 bg-white backdrop-blur-sm">
        <CardHeader className="space-y-4 p-6 pb-4">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Portal do Responsável" className="h-20 w-auto object-contain" />
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold" style={{ color: '#000000' }}>
              Portal do Responsável
            </CardTitle>
            <p className="text-base font-semibold" style={{ color: '#000000' }}>
              Acesse as informações escolares do seu filho
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-sm text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="token" className="font-bold" style={{ color: '#000000' }}>
                Código de Acesso
              </Label>
              <Input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                placeholder="Digite o código de acesso"
                required
                autoFocus
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Código fornecido pela escola
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="font-bold" style={{ color: '#000000' }}>
                Data de Nascimento do Aluno
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Confirme a data de nascimento para segurança
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Acessar Portal'}
            </Button>
          </form>

          <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-6">
            Não possui código de acesso? Entre em contato com a escola.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

