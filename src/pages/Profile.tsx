import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  Shield,
  Activity,
  ArrowLeft,
  FileText,
  MessageSquare,
  Clock,
  School
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EmojiAvatarPicker from '@/components/shared/EmojiAvatarPicker';
import UserAvatar from '@/components/shared/UserAvatar';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  roles: string[];
  primaryRole: string;
  school_id?: string;
  school_name?: string;
  tenant_id?: string;
  network_name?: string;
  created_at: string;
  is_active: boolean;
  avatar_emoji?: string;
  avatar_color?: string;
}

interface Activity {
  id: string;
  action: string;
  description: string;
  created_at: string;
  icon: any;
  color: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: ''
  });

  useEffect(() => {
    loadProfile();
    loadActivities();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Carregar perfil do banco (SEM user_roles no join)
      let profileData = null;
      let profileError = null;
      
      try {
        const result = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            phone,
            school_id,
            tenant_id,
            is_active,
            created_at,
            avatar_emoji,
            avatar_color,
            schools (
              id,
              school_name,
              tenant_id,
              tenants (
                id,
                network_name
              )
            )
          `)
          .eq('id', user.id)
          .single();
        
        profileData = result.data;
        profileError = result.error;
      } catch (error) {
        console.warn("⚠️ Erro ao buscar profile completo, tentando sem phone...", error);
        
        // Fallback: buscar sem phone
        const fallbackResult = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            school_id,
            tenant_id,
            is_active,
            created_at,
            avatar_emoji,
            avatar_color,
            schools (
              id,
              school_name,
              tenant_id,
              tenants (
                id,
                network_name
              )
            )
          `)
          .eq('id', user.id)
          .single();
        
        profileData = fallbackResult.data;
        profileError = fallbackResult.error;
      }
      
      if (profileError) throw profileError;
      
      // Buscar roles SEPARADAMENTE
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      // Processar roles
      const roles = rolesData?.map((r: any) => r.role) || [];
      const primaryRole = roles[0] || 'teacher';
      
      // Processar escola e rede
      const schoolData = profileData.schools as any;
      const schoolName = schoolData?.school_name;
      const networkName = schoolData?.tenants?.network_name;
      
      const userProfile: UserProfile = {
        id: profileData.id,
        full_name: profileData.full_name || user.user_metadata?.full_name || 'Usuário',
        email: user.email || '',
        phone: (profileData as any).phone || undefined,
        roles: roles,
        primaryRole: primaryRole,
        school_id: profileData.school_id,
        school_name: schoolName,
        tenant_id: profileData.tenant_id,
        network_name: networkName,
        created_at: profileData.created_at,
        is_active: profileData.is_active,
        avatar_emoji: profileData.avatar_emoji,
        avatar_color: profileData.avatar_color,
      };
      
      setProfile(userProfile);
      setFormData({
        full_name: userProfile.full_name,
        phone: userProfile.phone || ''
      });
      
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
      toast({
        title: "Erro ao carregar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const recentActivities: Activity[] = [];
      
      // Carregar PEIs criados recentemente
      const { data: recentPEIs } = await supabase
        .from('peis')
        .select('id, created_at, students(name)')
        .or(`created_by.eq.${user.id},assigned_teacher_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentPEIs) {
        recentPEIs.forEach((pei: any) => {
          recentActivities.push({
            id: `pei-${pei.id}`,
            action: 'PEI Criado',
            description: `Criou PEI para ${pei.students?.name || 'aluno'}`,
            created_at: pei.created_at,
            icon: <FileText className="h-4 w-4" />,
            color: 'text-blue-600'
          });
        });
      }
      
      // Carregar comentários recentes (com fallback se tabela não existir)
      let recentComments = null;
      try {
        const { data } = await supabase
          .from('pei_comments')
          .select('id, created_at, content, peis(students(name))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
        recentComments = data;
      } catch (error) {
        console.warn("⚠️ Tabela pei_comments não disponível:", error);
        recentComments = null;
      }
      
      if (recentComments) {
        recentComments.forEach((comment: any) => {
          recentActivities.push({
            id: `comment-${comment.id}`,
            action: 'Comentário Adicionado',
            description: `Comentou no PEI de ${comment.peis?.students?.name || 'aluno'}`,
            created_at: comment.created_at,
            icon: <MessageSquare className="h-4 w-4" />,
            color: 'text-purple-600'
          });
        });
      }
      
      // Ordenar por data
      recentActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setActivities(recentActivities.slice(0, 10));
      
    } catch (error: any) {
      console.error('Erro ao carregar atividades:', error);
    }
  };

  const handleAvatarChange = async (emoji: string, color: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_emoji: emoji,
          avatar_color: color,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Atualizar estado local
      if (profile) {
        setProfile({
          ...profile,
          avatar_emoji: emoji,
          avatar_color: color
        });
      }

      toast({
        title: "Avatar atualizado!",
        description: "Seu avatar foi alterado com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar avatar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o avatar.",
        variant: "destructive",
      });
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setProfile(prev => prev ? {
        ...prev,
        full_name: formData.full_name,
        phone: formData.phone
      } : null);
      
      setEditing(false);
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
      });
      
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro ao salvar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      superadmin: 'Super Administrador',
      education_secretary: 'Secretário de Educação',
      school_director: 'Diretor de Escola',
      coordinator: 'Coordenador',
      teacher: 'Professor',
      aee_teacher: 'Professor AEE',
      specialist: 'Especialista',
      school_manager: 'Gestor Escolar',
      family: 'Família'
    };
    return roleLabels[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      superadmin: 'destructive',
      education_secretary: 'default',
      school_director: 'secondary',
      coordinator: 'outline',
      teacher: 'outline',
      aee_teacher: 'outline',
      specialist: 'outline',
      school_manager: 'outline',
      family: 'outline'
    };
    return variants[role] || 'secondary';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5" />
              Meu Perfil
            </h1>
          </div>
        </header>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando perfil...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5" />
              Meu Perfil
            </h1>
          </div>
        </header>
        <div className="container mx-auto p-6">
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Perfil não encontrado</h3>
            <p className="text-muted-foreground">
              Não foi possível carregar as informações do perfil.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header com Navegação */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Meu Perfil
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie suas informações pessoais
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button variant="outline" onClick={() => setEditing(false)} size="sm">
                    Cancelar
                  </Button>
                  <Button onClick={saveProfile} disabled={saving} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 space-y-6">

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Pessoal
          </TabsTrigger>
          <TabsTrigger value="professional" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Profissional
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Atividade
          </TabsTrigger>
        </TabsList>

        {/* Informações Pessoais */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Suas informações básicas de contato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar Grande */}
                <div className="flex flex-col items-center gap-3">
                  <UserAvatar
                    emoji={profile.avatar_emoji}
                    color={profile.avatar_color}
                    fallbackName={profile.full_name}
                    size="xl"
                    className="border-4 border-primary/20"
                  />
                  <div className="text-center">
                    <p className="font-semibold text-lg">{profile.full_name}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                  <EmojiAvatarPicker
                    currentEmoji={profile.avatar_emoji || '👤'}
                    currentColor={profile.avatar_color || 'blue'}
                    onSelect={handleAvatarChange}
                  />
                </div>
                
                {/* Informações Editáveis */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Nome Completo</Label>
                      {editing ? (
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          placeholder="Seu nome completo"
                        />
                      ) : (
                        <p className="text-sm font-medium mt-2 p-2 bg-muted/30 rounded-md">
                          {profile.full_name}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <p className="text-sm font-medium mt-2 p-2 bg-muted/30 rounded-md flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {profile.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        O e-mail não pode ser alterado
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      {editing ? (
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+55 (11) 99999-9999"
                        />
                      ) : (
                        <p className="text-sm font-medium mt-2 p-2 bg-muted/30 rounded-md flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {profile.phone || 'Não informado'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status da Conta</Label>
                      <div className="mt-2">
                        <Badge variant={profile.is_active ? "default" : "secondary"} className="text-sm">
                          {profile.is_active ? "✓ Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Informações Profissionais */}
        <TabsContent value="professional">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Funções no Sistema</CardTitle>
                <CardDescription>
                  Suas permissões e responsabilidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Função Principal
                    </Label>
                    <Badge variant={getRoleBadgeVariant(profile.primaryRole)} className="text-base px-4 py-2">
                      {getRoleLabel(profile.primaryRole)}
                    </Badge>
                  </div>
                  
                  {profile.roles.length > 1 && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Funções Adicionais
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {profile.roles.slice(1).map((role, index) => (
                          <Badge key={index} variant="outline" className="text-sm">
                            {getRoleLabel(role)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Lotação</CardTitle>
                <CardDescription>
                  Instituições vinculadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Escola
                    </Label>
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <School className="h-5 w-5 text-primary" />
                      <span className="font-medium">
                        {profile.school_name || 'Não atribuída'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Rede de Ensino
                    </Label>
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="font-medium">
                        {profile.network_name || 'Não atribuída'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Conta criada em</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(profile.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">ID do Usuário</span>
                    </div>
                    <code className="text-xs text-muted-foreground font-mono">
                      {profile.id.slice(0, 8)}...
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Atividade */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
              <CardDescription>
                Histórico das suas ações no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma atividade recente</h3>
                  <p className="text-muted-foreground">
                    Suas atividades no sistema aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 border-2 rounded-lg hover:shadow-md transition-all"
                    >
                      <div className={`flex-shrink-0 mt-1 ${activity.color}`}>
                        {activity.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">
                              {activity.action}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            {format(new Date(activity.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </main>
    </div>
  );
}
