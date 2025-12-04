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
import { ArrowLeft, Mail, Lock, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createLoginRateLimiter, createPasswordResetRateLimiter } from "@/lib/rateLimit";
import { useTranslation } from "@pei/i18n";

// Password validation schema - LGPD and security compliant
const passwordSchema = z.string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número");

const Auth = () => {
  const { t } = useTranslation();
  
  // Verificar se há código de recovery na URL ao inicializar
  const initialSearchParams = new URLSearchParams(window.location.search);
  const initialCode = initialSearchParams.get("code");
  // Códigos de recovery podem ser: pkce_xxx, UUIDs (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx), ou códigos longos
  const isRecoveryCode = initialCode && (
    initialCode.startsWith("pkce_") || 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(initialCode) || // UUID format
    initialCode.length > 20
  );
  const hasInitialRecoveryCode = !!isRecoveryCode;
  
  // Verificar se há erros na URL (query string ou hash)
  const urlError = initialSearchParams.get("error");
  const urlErrorCode = initialSearchParams.get("error_code");
  const urlErrorDescription = initialSearchParams.get("error_description");
  
  // Verificar também no hash
  const hash = window.location.hash;
  const hashParams = hash ? new URLSearchParams(hash.replace(/^#/, "")) : new URLSearchParams();
  const hashError = hashParams.get("error") || urlError;
  const hashErrorCode = hashParams.get("error_code") || urlErrorCode;
  const hashErrorDescription = hashParams.get("error_description") || urlErrorDescription;
  
  const hasUrlError = !!hashError;
  
  // Log para debug
  if (hasInitialRecoveryCode) {
    console.log("🔑 Initial recovery code detected:", initialCode);
  }
  
  const [isLogin, setIsLogin] = useState(!hasInitialRecoveryCode && !hasUrlError);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(!!hasInitialRecoveryCode && !hasUrlError);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [urlErrorState, setUrlErrorState] = useState<{
    error: string;
    errorCode: string | null;
    errorDescription: string | null;
  } | null>(hasUrlError ? {
    error: hashError || "",
    errorCode: hashErrorCode,
    errorDescription: hashErrorDescription
  } : null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 🔧 FIX: Usar refs para garantir captura de valores (soluciona bug de preenchimento automático)
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Mostrar toast quando detectar erro na URL
  useEffect(() => {
    if (urlErrorState) {
      const errorMessage = urlErrorState.errorCode === "otp_expired" 
        ? "O link de recuperação expirou. Solicite um novo link."
        : urlErrorState.errorDescription 
          ? decodeURIComponent(urlErrorState.errorDescription.replace(/\+/g, " "))
          : "Erro ao processar link de recuperação";
      
      toast({
        title: urlErrorState.errorCode === "otp_expired" 
          ? "Link expirado" 
          : "Erro no link",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [urlErrorState, toast]);

  useEffect(() => {
    // ============================================
    // ABORDAGEM 1: Verificar se já existe sessão válida (Supabase pode ter processado automaticamente)
    // ============================================
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Verificar se é uma sessão de recovery
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");
        if (code) {
          console.log("✅ Sessão já existe, verificando se é recovery");
          // Se há código na URL e já tem sessão, provavelmente é recovery
          setIsResetPassword(true);
          setIsLogin(false);
          setIsForgotPassword(false);
          return true;
        }
      }
      return false;
    };

    // ============================================
    // ABORDAGEM 2: Processar código usando exchangeCodeForSession
    // ============================================
    const handleRecoveryCode = async (code: string, retryCount = 0): Promise<boolean> => {
      try {
        console.log(`🔄 [Abordagem 2] Exchanging code for session (tentativa ${retryCount + 1}):`, code);
        
        // Primeiro, verificar se já existe sessão válida
        const hasSession = await checkExistingSession();
        if (hasSession) {
          console.log("✅ [Abordagem 1] Sessão já existe, usando ela");
          return true;
        }
        
        // Troca o código por uma sessão válida
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error("❌ Erro ao trocar código por sessão:", error);
          
          // Se o erro for de link expirado ou inválido, mostrar mensagem
          if (error.message.includes("expired") || error.message.includes("invalid") || error.message.includes("already been used")) {
            setUrlErrorState({
              error: "access_denied",
              errorCode: "otp_expired",
              errorDescription: "Email link is invalid or has expired"
            });
            setIsResetPassword(false);
            setIsLogin(false);
            setIsForgotPassword(false);
            return false;
          }
          
          // Se for erro de código já usado, tentar verificar sessão novamente
          if (error.message.includes("already been used") && retryCount === 0) {
            console.log("🔄 Código já usado, verificando se sessão foi criada");
            await new Promise(resolve => setTimeout(resolve, 500));
            return await checkExistingSession();
          }
          
          throw error;
        }

        // Sessão criada com sucesso! Mostrar formulário de reset de senha
        console.log("✅ [Abordagem 2] Sessão criada com sucesso, mostrando formulário de reset");
        setIsResetPassword(true);
        setIsLogin(false);
        setIsForgotPassword(false);
        
        // Limpar o código da URL para evitar reprocessamento
        window.history.replaceState({}, document.title, "/auth");
        return true;
        
      } catch (error: any) {
        console.error("❌ Erro ao processar código de recovery:", error);
        
        // Se não for erro de expiração, tentar novamente uma vez
        if (retryCount === 0 && !error.message.includes("expired") && !error.message.includes("invalid")) {
          console.log("🔄 Tentando novamente após 500ms...");
          await new Promise(resolve => setTimeout(resolve, 500));
          return await handleRecoveryCode(code, 1);
        }
        
        toast({
          title: "Erro ao processar link",
          description: error.message || "Link inválido ou expirado. Solicite um novo email de recuperação.",
          variant: "destructive",
        });
        return false;
      }
    };

    // ============================================
    // ABORDAGEM 3: Aguardar processamento automático do Supabase
    // ============================================
    const waitForAutoProcessing = async (code: string, maxWait = 3000): Promise<boolean> => {
      console.log("⏳ [Abordagem 3] Aguardando processamento automático do Supabase...");
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWait) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("✅ [Abordagem 3] Supabase processou automaticamente!");
          setIsResetPassword(true);
          setIsLogin(false);
          setIsForgotPassword(false);
          window.history.replaceState({}, document.title, "/auth");
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return false;
    };

    // Detect recovery mode from URL (query or hash)
    const checkRecoveryMode = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      
      console.log("🔍 Checking recovery mode, search:", window.location.search, "hash:", hash);
      
      // Verificar se há um código na query string (formato: ?code=...)
      const code = searchParams.get("code");
      
      // Verificar hash para tokens de recovery (formato: #access_token=...&type=recovery&...)
      const hashParams = hash ? new URLSearchParams(hash.replace(/^#/, "")) : new URLSearchParams();
      const urlType = searchParams.get("type") || hashParams.get("type");
      
      // Verificar se há access_token no hash (indicador de recovery)
      const hasAccessToken = hash.includes("access_token");
      // Verificar se há refresh_token no hash (também indica recovery)
      const hasRefreshToken = hash.includes("refresh_token");
      
      // Verificar se type=recovery está presente no hash
      const hasRecoveryType = hash.includes("type=recovery");
      
      // Se houver um código na query string, pode ser recovery (o Supabase processará)
      const hasCode = !!code;
      
      // Verificar também se o código parece ser um código de recovery do Supabase
      // Códigos de recovery podem ser: pkce_xxx, UUIDs (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx), ou códigos longos
      const isRecoveryCode = hasCode && code && (
        code.startsWith("pkce_") || // Códigos PKCE do Supabase
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code) || // UUID format
        code.length > 20 // Códigos longos
      );
      
      const isUrlRecovery = urlType === "recovery" || 
                           (hasAccessToken && hasRecoveryType) || 
                           (hasRefreshToken && hasRecoveryType) ||
                           isRecoveryCode; // Código de recovery na query string

      console.log("🔍 Recovery check result:", { 
        code, 
        urlType, 
        hasAccessToken, 
        hasRefreshToken, 
        hasRecoveryType, 
        hasCode,
        isRecoveryCode,
        isUrlRecovery 
      });

      // Se houver código de recovery, tentar múltiplas abordagens
      if (isRecoveryCode && code) {
        // Tentar abordagem 1 primeiro (verificar sessão existente)
        checkExistingSession().then(hasSession => {
          if (!hasSession) {
            // Se não tem sessão, tentar abordagem 3 (aguardar processamento automático)
            waitForAutoProcessing(code).then(processed => {
              if (!processed) {
                // Se não processou automaticamente, usar abordagem 2 (exchangeCodeForSession)
                handleRecoveryCode(code);
              }
            });
          }
        });
        return true;
      }

      if (isUrlRecovery) {
        console.log("✅ Setting reset password mode");
        setIsResetPassword(true);
        setIsLogin(false);
        setIsForgotPassword(false);
        return true;
      }
      return false;
    };

    // Verificar imediatamente ao carregar
    const isUrlRecovery = checkRecoveryMode();
    
    // Verificação adicional imediata para códigos na query string
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");
    const isCodeRecovery = code && (
      code.startsWith("pkce_") || 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code) ||
      code.length > 20
    );
    if (isCodeRecovery && code) {
      console.log("🔑 Immediate code detection, trying multiple approaches");
      
      // Tentar abordagem 1 primeiro (verificar sessão existente)
      checkExistingSession().then(hasSession => {
        if (!hasSession) {
          // Se não tem sessão, tentar abordagem 3 (aguardar processamento automático)
          waitForAutoProcessing(code).then(processed => {
            if (!processed) {
              // Se não processou automaticamente, usar abordagem 2 (exchangeCodeForSession)
              handleRecoveryCode(code);
            }
          });
        }
      });
    }
    
    // Listener para mudanças no hash (quando o Supabase redireciona)
    const handleHashChange = () => {
      console.log("🔍 Hash changed, re-checking recovery mode");
      const newHash = window.location.hash;
      const newHashParams = newHash ? new URLSearchParams(newHash.replace(/^#/, "")) : new URLSearchParams();
      const hashError = newHashParams.get("error");
      
      // Verificar se há erro no hash
      if (hashError) {
        const errorCode = newHashParams.get("error_code");
        const errorDescription = newHashParams.get("error_description");
        setUrlErrorState({
          error: hashError,
          errorCode,
          errorDescription
        });
        setIsResetPassword(false);
        setIsLogin(false);
        setIsForgotPassword(false);
      } else {
        checkRecoveryMode();
      }
    };
    
    // Listener para mudanças na query string também
    let lastSearch = window.location.search;
    const checkQueryChange = () => {
      const currentSearch = window.location.search;
      if (currentSearch !== lastSearch) {
        console.log("🔍 Query string changed, re-checking recovery mode");
        lastSearch = currentSearch;
        
        // Verificar se há erro na query string
        const searchParams = new URLSearchParams(currentSearch);
        const queryError = searchParams.get("error");
        if (queryError) {
          const errorCode = searchParams.get("error_code");
          const errorDescription = searchParams.get("error_description");
          setUrlErrorState({
            error: queryError,
            errorCode,
            errorDescription
          });
          setIsResetPassword(false);
          setIsLogin(false);
          setIsForgotPassword(false);
        } else {
          checkRecoveryMode();
        }
      }
    };
    
    window.addEventListener("hashchange", handleHashChange);
    // Verificar mudanças na query string periodicamente (já que não há evento nativo)
    const queryCheckInterval = setInterval(checkQueryChange, 100);

    // ============================================
    // ABORDAGEM 4: Usar onAuthStateChange para detectar processamento automático
    // ============================================
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 [Abordagem 4] Auth state change:", event, session ? "session exists" : "no session");
      
      // Evento específico de recovery
      if (event === "PASSWORD_RECOVERY") {
        console.log("✅ [Abordagem 4] PASSWORD_RECOVERY event detected");
        setIsResetPassword(true);
        setIsLogin(false);
        setIsForgotPassword(false);
        return; // prevent redirect during recovery
      }

      // Se houver código na URL e evento de sign in, pode ser recovery processado
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      
      if (code && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        console.log("🔑 [Abordagem 4] Code detected with SIGNED_IN/TOKEN_REFRESHED, checking if recovery");
        
        // Verificar se o código é de recovery
        const isCodeRecovery = code.startsWith("pkce_") || 
                               /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code) ||
                               code.length > 20;
        
        if (isCodeRecovery && session) {
          console.log("✅ [Abordagem 4] Recovery code processed by Supabase automatically");
          setIsResetPassword(true);
          setIsLogin(false);
          setIsForgotPassword(false);
          window.history.replaceState({}, document.title, "/auth");
          return;
        }
      }

      // Re-verificar recovery mode após mudança de estado
      const stillInRecovery = checkRecoveryMode();
      
      // Se não estiver em recovery e tiver sessão, redirecionar
      if (session && !stillInRecovery && event !== "PASSWORD_RECOVERY") {
        navigate("/dashboard");
      }
    });

    // Verificar também se há tokens no hash após um pequeno delay (para dar tempo do Supabase processar)
    const checkHashAfterDelay = setTimeout(() => {
      const hash = window.location.hash;
      
      // Se houver tokens no hash, verificar se precisa processar
      if (hash && (hash.includes("access_token") || hash.includes("refresh_token"))) {
        console.log("🔑 Tentando processar tokens do hash manualmente");
        
        // Re-verificar recovery mode (pode ter mudado)
        const stillInRecovery = checkRecoveryMode();
        if (stillInRecovery) {
          console.log("🔑 Recovery mode detected from hash after delay");
        } else if (hash.includes("type=recovery")) {
          // Se ainda não detectou mas há type=recovery no hash, forçar modo recovery
          console.log("🔑 Forçando modo recovery baseado no hash");
          setIsResetPassword(true);
          setIsLogin(false);
          setIsForgotPassword(false);
        }
      }
    }, 500);

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      const stillInRecovery = checkRecoveryMode();
      // Só redirecionar se não estiver em modo de recovery
      if (session && !stillInRecovery) {
        navigate("/dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(checkHashAfterDelay);
      window.removeEventListener("hashchange", handleHashChange);
      clearInterval(queryCheckInterval);
    };
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
          title: t("auth.passwordResetSuccess"),
          description: t("auth.passwordResetSuccess"),
        });
        setIsResetPassword(false);
        setIsLogin(true);
        navigate("/dashboard");
      } else if (isForgotPassword) {
        // Redirecionar para rota dedicada de reset de senha
        const redirectUrl = `${window.location.origin}/auth/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
          redirectTo: redirectUrl,
        });

        if (error) {
          // Tratamento específico de erros comuns
          if (error.message.includes('For security purposes') || error.message.includes('rate limit')) {
            throw new Error('Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.');
          } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
            throw new Error('Este email não está cadastrado no sistema. Verifique o email ou entre em contato com o administrador.');
          } else if (error.message.includes('email not confirmed')) {
            throw new Error('Este email ainda não foi confirmado. Entre em contato com o administrador para ativar sua conta.');
          } else if (error.message.includes('invalid email')) {
            throw new Error('Email inválido. Verifique o formato do email.');
          } else {
            console.error('Erro ao enviar email de recuperação:', error);
            throw new Error(`Erro ao enviar email: ${error.message || 'Erro desconhecido. Tente novamente mais tarde.'}`);
          }
        }

        toast({
          title: t("auth.passwordResetSent"),
          description: t("auth.passwordResetSent"),
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
      }
    } catch (error: any) {
      // Reportar erro crítico de autenticação
      if (typeof window !== 'undefined') {
        import('@/lib/errorReporting').then(({ reportAuthError }) => {
          const errorObj = error instanceof Error ? error : new Error(error?.message || 'Erro desconhecido');
          reportAuthError(errorObj, {
            operation: isLogin ? 'login' : isForgotPassword ? 'password_reset' : 'session_check',
            email: emailRef.current?.value || email,
          }).catch(err => console.error('Erro ao reportar erro de autenticação:', err));
        }).catch(err => console.error('Erro ao importar errorReporting:', err));
      }
      
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
                ? t("auth.resetPassword")
                : (isForgotPassword ? t("auth.forgotPassword") : t("auth.login"))
              }
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isResetPassword
                ? t("auth.resetPassword")
                : (isForgotPassword
                  ? t("auth.enterEmail")
                  : t("auth.enterEmail")
                )
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* Mostrar erro de URL se houver */}
          {urlErrorState && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-800 space-y-2">
                <div className="font-semibold">
                  {urlErrorState.errorCode === "otp_expired" 
                    ? "Link de recuperação expirado" 
                    : "Erro ao processar link de recuperação"}
                </div>
                <div>
                  {urlErrorState.errorCode === "otp_expired" 
                    ? "O link de recuperação de senha expirou ou é inválido. Por favor, solicite um novo link."
                    : urlErrorState.errorDescription 
                      ? decodeURIComponent(urlErrorState.errorDescription.replace(/\+/g, " "))
                      : "Ocorreu um erro ao processar o link. Tente solicitar um novo link de recuperação."}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setUrlErrorState(null);
                    setIsForgotPassword(true);
                    setIsLogin(false);
                    setIsResetPassword(false);
                    // Limpar a URL
                    window.history.replaceState({}, document.title, "/auth");
                  }}
                >
                  Solicitar novo link de recuperação
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-semibold">
                  {t("auth.email")}
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
                  {t("auth.password")}
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
                {isResetPassword && (
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
                isResetPassword ? "Redefinir Senha" : (isForgotPassword ? "Enviar Link" : "Entrar")
              )}
            </Button>

            <div className="text-center space-y-2 pt-2">
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