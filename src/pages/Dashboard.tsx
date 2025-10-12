import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import SuperadminDashboard from "@/components/dashboards/SuperadminDashboard";
import CoordinatorDashboard from "@/components/dashboards/CoordinatorDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import FamilyDashboard from "@/components/dashboards/FamilyDashboard";
import SchoolManagerDashboard from "@/components/dashboards/SchoolManagerDashboard";
import AEETeacherDashboard from "@/components/dashboards/AEETeacherDashboard";
import TutorialCards from "@/components/tutorial/TutorialCards";
import NotificationBell from "@/components/shared/NotificationBell";
import InstitutionalLogo from "@/components/shared/InstitutionalLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Clock, Heart, Users, Sparkles, Mail, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type UserRole = "superadmin" | "coordinator" | "teacher" | "family" | "school_manager" | "aee_teacher";

interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  tenant_id: string | null;
  is_active?: boolean;
}

// Componente de aguardando aprovação
const PendingApprovalScreen = ({ userName, userEmail, onLogout }: { userName: string; userEmail: string; onLogout: () => void }) => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1920&h=1080&fit=crop"
          alt="Ambiente educacional inclusivo"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/85 to-blue-900/90 backdrop-blur-[2px]" />
      </div>

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onLogout}
        className="absolute top-6 left-6 text-white hover:bg-white/10 z-10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Sair
      </Button>

      {/* Main Card */}
      <Card className="w-full max-w-2xl shadow-2xl relative z-10 border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-6 pb-6 text-center">
          <div className="flex justify-center">
            <img src={logo} alt="PEI Collab" className="h-24 w-auto" />
          </div>
          
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-2">
              <Clock className="w-10 h-10 text-indigo-600" />
            </div>
            
            <CardTitle className="text-3xl font-bold text-gray-900">
              Bem-vindo ao PEI Collab, {userName}!
            </CardTitle>
            
            <CardDescription className="text-lg text-gray-600">
              Seu cadastro foi realizado com sucesso e está aguardando aprovação
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Box */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">
                  Próximos Passos
                </h3>
                <p className="text-gray-700 leading-relaxed text-sm">
                  Um administrador está revisando seu cadastro. Você receberá um email em{" "}
                  <strong className="text-indigo-700">{userEmail}</strong> assim que sua conta for aprovada.
                </p>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">
              Enquanto isso, conheça o PEI Collab
            </h3>
            
            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Educação Inclusiva no Centro
                  </h4>
                  <p className="text-sm text-gray-600">
                    O PEI Collab foi criado para facilitar a construção de Planos Educacionais Individualizados, 
                    respeitando o ritmo e as necessidades únicas de cada aluno.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Colaboração que Transforma
                  </h4>
                  <p className="text-sm text-gray-600">
                    Conecte professores, coordenadores, terapeutas e famílias em um espaço 
                    colaborativo onde todos trabalham juntos pelo desenvolvimento do aluno.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Celebre Cada Conquista
                  </h4>
                  <p className="text-sm text-gray-600">
                    Acompanhe o progresso com timeline interativa, registre marcos importantes e 
                    celebre cada passo na jornada de aprendizado.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">
              Tem alguma dúvida ou precisa de ajuda?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => window.open('mailto:suporte@peicollab.com', '_blank')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Entrar em Contato
              </Button>
              <Button
                onClick={onLogout}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
              >
                Sair
              </Button>
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-gray-700 leading-relaxed text-center">
              💡 <strong>Dica:</strong> Adicione <strong>noreply@peicollab.com</strong> aos 
              seus contatos para não perder o email de aprovação.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      console.log("🔍 Carregando perfil para userId:", userId);

      // 1. Buscar role da tabela user_roles (fonte primária)
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      console.log("📋 Role encontrada em user_roles:", roleData);

      if (roleError && roleError.code !== 'PGRST116') {
        console.error("❌ Erro ao carregar role:", roleError);
        throw roleError;
      }

      // 2. Buscar dados básicos do profile (COM is_active)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, tenant_id, is_active")
        .eq("id", userId)
        .maybeSingle();

      console.log("👤 Profile encontrado:", profileData);

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("❌ Erro ao carregar profile:", profileError);
        throw profileError;
      }

      // 3. Determinar o role final (prioridade: user_roles)
      let finalRole: UserRole = roleData?.role || "teacher";
      console.log("✅ Role final determinada:", finalRole);

      // 4. Buscar tenant_id
      let finalTenantId = profileData?.tenant_id;

      if (!finalTenantId) {
        const { data: tenantData } = await supabase
          .from("user_tenants")
          .select("tenant_id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        finalTenantId = tenantData?.tenant_id || null;
      }

      console.log("🏢 Tenant ID:", finalTenantId);

      // 5. Se não existe profile, criar
      if (!profileData) {
        console.log("⚠️ Profile não existe, criando...");

        const { data: { user: authUser } } = await supabase.auth.getUser();
        const defaultName = authUser?.user_metadata?.full_name || authUser?.email || "Usuário";

        const { data: inserted, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            full_name: defaultName,
            tenant_id: finalTenantId,
            is_active: false,
          })
          .select("id, full_name, tenant_id, is_active")
          .single();

        if (insertError) {
          console.error("❌ Erro ao inserir profile:", insertError);
          throw insertError;
        }

        console.log("✅ Profile criado:", inserted);

        // Criar role se não existir
        if (!roleData) {
          const { error: roleInsertError } = await supabase
            .from("user_roles")
            .insert({
              user_id: userId,
              role: finalRole,
            });

          if (roleInsertError) {
            console.error("❌ Erro ao criar role:", roleInsertError);
          } else {
            console.log("✅ Role criada em user_roles");
          }
        }

        setProfile({
          id: inserted.id,
          full_name: inserted.full_name,
          role: finalRole,
          tenant_id: finalTenantId,
          is_active: false,
        });
      } else {
        // Profile existe, montar objeto completo
        setProfile({
          id: profileData.id,
          full_name: profileData.full_name,
          role: finalRole,
          tenant_id: finalTenantId,
          is_active: profileData.is_active ?? false,
        });
      }

      // 6. Carregar nome do tenant se houver
      if (finalTenantId) {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("name")
          .eq("id", finalTenantId)
          .maybeSingle();

        if (tenant) {
          setTenantName(tenant.name);
          console.log("🏢 Nome do tenant:", tenant.name);
        }
      }

      console.log("🎉 Perfil carregado com sucesso!");

      // 7. Verificar se usuário precisa de tenant mas não tem
      if (!finalTenantId && finalRole !== "superadmin") {
        console.warn("⚠️ ATENÇÃO: Usuário não-superadmin sem tenant associado!");
      }

    } catch (error: any) {
      console.error("❌ Erro completo ao carregar perfil:", error);
      toast({
        title: "Erro ao carregar perfil",
        description: error.message || "Não foi possível carregar o perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
        <div className="text-center">
          <img src={logo} alt="PEI Collab" className="h-20 w-auto mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Verificar se o usuário não está ativo
  if (profile && !profile.is_active && profile.role !== "superadmin") {
    return (
      <PendingApprovalScreen
        userName={profile.full_name}
        userEmail={user?.email || ""}
        onLogout={handleLogout}
      />
    );
  }

  const renderDashboard = () => {
    if (!profile) {
      console.log("⚠️ Nenhum perfil disponível para renderizar");
      return (
        <PendingApprovalScreen
          userName={user?.user_metadata?.full_name || user?.email || "Usuário"}
          userEmail={user?.email || ""}
          onLogout={handleLogout}
        />
      );
    }

    console.log("🎨 Renderizando dashboard para role:", profile.role);

    switch (profile.role) {
      case "superadmin":
        return <SuperadminDashboard profile={profile} />;
      case "coordinator":
        return <CoordinatorDashboard profile={profile} />;
      case "teacher":
        return <TeacherDashboard profile={profile} />;
      case "family":
        return <FamilyDashboard profile={profile} />;
      case "school_manager":
        return <SchoolManagerDashboard profile={profile} />;
      case "aee_teacher":
        return <AEETeacherDashboard profile={profile} />;
      default:
        console.log("❌ Role não reconhecida:", profile.role);
        return <div>Perfil não reconhecido: {profile.role}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile && (
              <InstitutionalLogo
                tenantId={profile.tenant_id}
                userRole={profile.role}
              />
            )}
            <div>
              <h1 className="font-bold text-lg">PEI Collab</h1>
              {profile && (
                <p className="text-xs text-muted-foreground">
                  {profile.full_name} • {profile.role}
                </p>
              )}
              {tenantName && profile?.role !== "superadmin" && (
                <p className="text-sm font-medium text-primary mt-1">
                  {tenantName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile?.role !== "superadmin" && <NotificationBell />}
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {renderDashboard()}
      </main>

      {profile && profile.is_active && !loading && <TutorialCards userRole={profile.role} />}
    </div>
  );
};

export default Dashboard;