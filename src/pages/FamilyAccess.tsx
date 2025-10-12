// src/pages/FamilyAccess.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { KeyRound, ShieldAlert, Loader2, ArrowLeft } from "lucide-react";

const FamilyAccess = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [step, setStep] = useState<'code' | 'verify'>('code');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setToken(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (token.length < 6) {
        throw new Error("O código deve ter pelo menos 6 caracteres");
      }

      setStep('verify');
      toast({
        title: "Código aceito",
        description: "Agora confirme a data de nascimento do aluno para acessar o PEI.",
      });
    } catch (error: any) {
      toast({
        title: "Código inválido",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setBlocked(false);

    try {
      console.log('Iniciando verificação. Código:', token, 'Data:', dateOfBirth);

      const { data, error } = await supabase.functions.invoke('validate-family-access', {
        body: {
          code: token.toUpperCase(),
          dateOfBirth: dateOfBirth,
          clientIp: 'web-app'
        }
      });

      console.log('Resposta da validação:', data, 'Erro:', error);

      if (error) {
        throw new Error(error.message || "Erro ao validar código");
      }

      if (data?.blocked) {
        setBlocked(true);
        throw new Error(data.error || "Muitas tentativas. Aguarde 15 minutos e tente novamente.");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success || !data?.peiId) {
        throw new Error("Código inválido ou expirado");
      }

      console.log('Acesso validado! PEI ID:', data.peiId);

      toast({
        title: "Acesso autorizado!",
        description: "Redirecionando para o PEI...",
      });
      
      setTimeout(() => {
        navigate(`/family/pei/${data.peiId}?token=${token.toUpperCase()}`);
      }, 500);

    } catch (error: any) {
      console.error('Erro na verificação:', error);
      toast({
        title: blocked ? "Muitas tentativas" : "Erro ao verificar acesso",
        description: error.message || "Não foi possível validar o acesso. Verifique os dados.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1920&h=1080&fit=crop"
          alt="Família feliz em ambiente acolhedor"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/85 via-purple-900/80 to-blue-900/85 backdrop-blur-[2px]" />
      </div>

      {/* Back to Home Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-white hover:bg-white/10 z-10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para o início
      </Button>

      {/* Main Card */}
      <Card className="w-full max-w-md shadow-2xl relative z-10 border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex justify-center">
            <img src={logo} alt="PEI Collab" className="h-20 w-auto" />
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Acesso da Família
            </CardTitle>
            <CardDescription className="text-gray-600">
              {step === 'code' 
                ? "Digite o código do PEI que você recebeu da coordenação"
                : "Confirme a data de nascimento do aluno"
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <ShieldAlert className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-gray-700">
              <strong>Importante:</strong> O acesso é pessoal e intransferível. 
              O código expira em 7 dias e não deve ser compartilhado.
            </AlertDescription>
          </Alert>

          {blocked && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Você excedeu o número de tentativas permitidas. 
                Por favor, aguarde 15 minutos antes de tentar novamente.
              </AlertDescription>
            </Alert>
          )}

          {step === 'code' ? (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token" className="text-gray-700 font-semibold">
                  Código de Acesso
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-indigo-400" />
                  <Input
                    id="token"
                    type="text"
                    placeholder="Ex: ABC12345"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    className="pl-11 text-center text-lg font-mono tracking-widest border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    maxLength={32}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Cole o código que você recebeu por e-mail ou mensagem
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-base"
                disabled={loading || token.length < 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>

              <div className="text-center text-sm text-gray-600 pt-2">
                <p className="font-medium">Não tem um código?</p>
                <p className="mt-1">
                  Entre em contato com a coordenação da escola.
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-gray-700 font-semibold">
                  Data de Nascimento do Aluno
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  autoFocus
                  required
                  disabled={blocked}
                />
                <p className="text-xs text-gray-500">
                  Para sua segurança, confirme a data de nascimento do aluno
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('code');
                    setDateOfBirth("");
                    setBlocked(false);
                  }}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
                  disabled={verifying || !dateOfBirth || blocked}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Acessar PEI"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Info Box */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 mt-6 border border-indigo-100">
            <p className="text-xs text-gray-700 leading-relaxed">
              <strong className="text-indigo-700">💜 Sobre o acesso:</strong>
              <br />
              Este é um espaço seguro para você acompanhar o desenvolvimento e 
              o plano educacional individualizado do seu filho. Qualquer dúvida, 
              entre em contato com a escola.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyAccess;