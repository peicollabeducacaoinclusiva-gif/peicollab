import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
// Logo está em /public/logo.png
import { ArrowLeft, Mail, Lock, User, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createLoginRateLimiter, createPasswordResetRateLimiter } from "@/lib/rateLimit";

// Password validation schema - LGPD and security compliant
const passwordSchema = z.string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 🔧 FIX: Usar refs para garantir captura de valores (soluciona bug de preenchimento automático)
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Detect recovery mode from URL (query or hash)
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, "?"));
    const urlType = searchParams.get("type") || hashParams.get("type");
    const isUrlRecovery = urlType === "recovery";

    if (isUrlRecovery) {
      setIsResetPassword(true);
      setIsLogin(false);
      setIsForgotPassword(false);
    }

    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsResetPassword(true);
        setIsLogin(false);
        setIsForgotPassword(false);
        return; // prevent redirect during recovery
      }

      if (session && !isUrlRecovery) {
        navigate("/dashboard");
      }
    });

    // THEN check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !isUrlRecovery) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError("");

    try {
      // 🔒 RATE LIMITING: Verificar se está bloqueado antes de tentar
      if (isLogin && email) {
        const rateLimiter = createLoginRateLimiter(email);
        const blockCheck = rateLimiter.isBlocked();
        
        if (blockCheck.blocked) {
          toast({
            title: "Muitas tentativas",
            description: blockCheck.message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      } else if (isForgotPassword && email) {
        const rateLimiter = createPasswordResetRateLimiter(email);
        const blockCheck = rateLimiter.isBlocked();
        
        if (blockCheck.blocked) {
          toast({
            title: "Muitas tentativas",
            description: blockCheck.message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }
      
      // 🔧 FIX: Obter valores dos refs (soluciona bug de captura)
      const emailValue = emailRef.current?.value || email;
      const passwordValue = passwordRef.current?.value || password;
      const fullNameValue = fullNameRef.current?.value || fullName;
      
      if (isResetPassword) {
        // Validate password strength
        const validation = passwordSchema.safeParse(passwordValue);
        if (!validation.success) {
          setPasswordError(validation.error.issues[0].message);
          setLoading(false);
          return;
        }

        // Check LGPD consent
        if (!acceptedTerms) {
          toast({
            title: "Termos necessários",
            description: "Você precisa aceitar os termos de uso e política de privacidade.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password: passwordValue,
        });

        if (error) throw error;

        toast({
          title: "Senha definida com sucesso!",
          description: "Sua senha foi configurada. Você já pode acessar o sistema.",
        });
        setIsResetPassword(false);
        setIsLogin(true);
        navigate("/dashboard");
      } else if (isForgotPassword) {
        const { error} = await supabase.auth.resetPasswordForEmail(emailValue, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) throw error;

        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
        setIsForgotPassword(false);
        setIsLogin(true);
      } else if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailValue,
          password: passwordValue,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Email ou senha incorretos. Tente novamente.");
          }
          throw error;
        }

        // Check if user is active and has proper setup
        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("is_active, school_id")
            .eq("id", data.user.id)
            .single();

          if (profileError) {
            throw new Error("Erro ao verificar status do usuário.");
          }

          if (!profile?.is_active) {
            await supabase.auth.signOut();
            throw new Error("Sua conta está inativa. Entre em contato com o administrador.");
          }

          // Buscar role do usuário
          const { data: userRoles, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .single();

          // Roles que NÃO precisam de school_id
          const rolesWithoutSchoolReq = ["superadmin", "education_secretary"];
          const userRole = userRoles?.role;

          // Check if user has school assigned (apenas se não for role especial)
          if (!profile?.school_id && !rolesWithoutSchoolReq.includes(userRole)) {
            await supabase.auth.signOut();
            throw new Error("Sua conta ainda não foi vinculada a uma escola. Entre em contato com o administrador.");
          }
        }

        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta ao PEI Collab.",
        });
      } else {
        // Validate password for signup
        const validation = passwordSchema.safeParse(password);
        if (!validation.success) {
          setPasswordError(validation.error.issues[0].message);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            // Removido emailRedirectTo para evitar bloqueio de extensões
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            throw new Error("Este email já está cadastrado. Faça login.");
          }
          throw error;
        }

        toast({
          title: "Cadastro solicitado!",
          description: "Sua conta foi criada mas ainda precisa ser ativada por um administrador. Você receberá um email quando estiver ativa.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      
      // Tratamento especial para erros de rede e bloqueios
      if (error.message === "Failed to fetch" || error.name === "NetworkError" || error.name === "AuthRetryableFetchError") {
        toast({
          title: "Erro de Conexão",
          description: "A requisição foi bloqueada. Isso geralmente acontece por extensões de navegador (bloqueadores de anúncios). Tente desabilitar suas extensões ou usar modo anônimo.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: error.message || "Ocorreu um erro. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

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
            <img src="/logo.png" alt="PEI Collab" className="h-20 w-auto" />
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isResetPassword 
                ? "Definir Nova Senha" 
                : (isForgotPassword ? "Recuperar Senha" : (isLogin ? "Entrar" : "Criar Conta"))
              }
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isResetPassword
                ? "Digite sua nova senha para acessar o sistema"
                : (isForgotPassword
                  ? "Digite seu email para receber o link de recuperação"
                  : (isLogin 
                    ? "Entre com suas credenciais para acessar o sistema"
                    : "Preencha os dados para criar sua conta"
                  )
                )
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {!isLogin && !isForgotPassword && !isResetPassword && (
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                Após o cadastro, sua conta precisará ser ativada por um administrador antes de você poder acessar o sistema.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && !isForgotPassword && !isResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-700 font-semibold">
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-indigo-400" />
                  <Input
                    ref={fullNameRef}
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    className="pl-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}
            
            {!isResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-semibold">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-indigo-400" />
                  <Input
                    ref={emailRef}
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="pl-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            )}

            {(!isForgotPassword || isResetPassword) && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-semibold">
                  {isResetPassword ? "Nova Senha" : "Senha"}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-indigo-400" />
                  <Input
                    ref={passwordRef}
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className={`pl-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 ${passwordError ? "border-red-500" : ""}`}
                    required
                    minLength={8}
                  />
                </div>
                {(isResetPassword || !isLogin) && (
                  <p className="text-xs text-gray-500">
                    Mínimo 8 caracteres, incluindo maiúscula, minúscula e número
                  </p>
                )}
                {passwordError && (
                  <p className="text-xs text-red-600">{passwordError}</p>
                )}
              </div>
            )}

            {isResetPassword && (
              <div className="flex items-start space-x-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-relaxed text-gray-700 cursor-pointer"
                >
                  Li e aceito os{" "}
                  <a href="/termos" className="text-indigo-600 font-semibold underline hover:text-indigo-700" target="_blank">
                    termos de uso
                  </a>{" "}
                  e a{" "}
                  <a href="/privacidade" className="text-indigo-600 font-semibold underline hover:text-indigo-700" target="_blank">
                    política de privacidade
                  </a>
                  . Autorizo o tratamento dos meus dados pessoais conforme a LGPD.
                </label>
              </div>
            )}

            <Button
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-base shadow-lg hover:shadow-xl transition-all"
              disabled={loading}
            >
              {loading ? "Carregando..." : (
                isResetPassword ? "Redefinir Senha" : (isForgotPassword ? "Enviar Link" : (isLogin ? "Entrar" : "Criar Conta"))
              )}
            </Button>

            <div className="text-center space-y-2 pt-2">
              {!isForgotPassword && !isResetPassword && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-gray-600 hover:text-indigo-600"
                >
                  {isLogin 
                    ? "Não tem conta? Cadastre-se" 
                    : "Já tem conta? Faça login"
                  }
                </Button>
              )}
              
              {isLogin && !isForgotPassword && !isResetPassword && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-gray-600 hover:text-indigo-600"
                >
                  Esqueceu sua senha?
                </Button>
              )}

              {isForgotPassword && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setIsLogin(true);
                  }}
                  className="text-sm text-gray-600 hover:text-indigo-600"
                >
                  Voltar para login
                </Button>
              )}
            </div>
          </form>

          {/* Security Badge */}
          {(isLogin || isForgotPassword) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Conexão segura e protegida por criptografia</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;