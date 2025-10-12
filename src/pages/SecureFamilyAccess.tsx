import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

interface ValidationResponse {
  valid: boolean;
  error?: string;
  student_name?: string;
  pei_id?: string;
  student_id?: string;
  tenant_name?: string;
  expires_at?: string;
}

export default function SecureFamilyAccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Token de acesso não fornecido");
      setLoading(false);
      return;
    }

    validateAndLogin(token);
  }, [searchParams]);

  const validateAndLogin = async (token: string) => {
    try {
      console.log("Validando token...");
      
      // Validar token via RPC
      const { data: validation, error: rpcError } = await supabase
        .rpc("validate_family_token", { token_value: token });

      if (rpcError) {
        console.error("Erro na validação:", rpcError);
        throw new Error("Erro ao validar token");
      }

      console.log("Resposta da validação:", validation);

      const parsedValidation = validation as unknown as ValidationResponse;

      if (!parsedValidation.valid) {
        setError(parsedValidation.error || "Token inválido ou expirado");
        setLoading(false);
        return;
      }

      // Criar usuário temporário usando o token como identificador
      const guestEmail = `family_guest_${token}@temp.peicollab.app`;
      const guestPassword = token + "_secure_2025";

      console.log("Tentando login como guest...");

      // Tentar fazer login primeiro (caso já exista)
      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: guestEmail,
        password: guestPassword,
      });

      // Se não existe, criar conta temporária
      if (signInError) {
        console.log("Usuário não existe, criando...");
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: guestEmail,
          password: guestPassword,
          options: {
            data: {
              full_name: `Família - ${parsedValidation.student_name}`,
              role: "family",
            },
          },
        });

        if (signUpError) {
          console.error("Erro ao criar conta guest:", signUpError);
          throw signUpError;
        }

        signInData = signUpData;
      }

      if (!signInData?.user) {
        throw new Error("Falha ao autenticar");
      }

      console.log("Login bem-sucedido, redirecionando...");

      // Redirecionar para visualização do PEI
      toast({
        title: "Acesso autorizado",
        description: `Bem-vindo! Visualizando PEI de ${parsedValidation.student_name}`,
      });

      navigate(`/family/pei/${parsedValidation.pei_id}?token=${token}`);
      
    } catch (error: any) {
      console.error("Erro no processo de autenticação:", error);
      setError(error.message || "Erro ao processar acesso");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 flex items-center justify-center">
              <img src="/placeholder.svg" alt="Logo" className="h-10 w-auto" />
            </div>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Validando acesso...</p>
            <p className="text-sm text-muted-foreground text-center">
              Aguarde enquanto verificamos suas credenciais de acesso
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="h-16 flex items-center justify-center">
              <img src="/placeholder.svg" alt="Logo" className="h-10 w-auto" />
            </div>
            
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-center">
                <strong className="block mb-2">Acesso Negado</strong>
                {error}
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg w-full">
              <p className="text-sm text-muted-foreground text-center mb-3">
                O link de acesso pode ter expirado ou ser inválido.
              </p>
              <p className="text-sm font-medium text-center">
                Solicite um novo link de acesso à coordenação da escola.
              </p>
            </div>

            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="w-full"
            >
              Voltar para página inicial
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
