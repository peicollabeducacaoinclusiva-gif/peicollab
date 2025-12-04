import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { Plus, Bell, MessageSquare, Calendar, FileText, Pin } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge, Textarea, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  is_pinned: boolean;
  publish_date: string;
  expires_date: string | null;
  author_name: string;
  read_by: any[];
}

interface Message {
  id: string;
  subject: string;
  message: string;
  priority: string;
  is_read: boolean;
  from_user_name: string;
  to_user_name: string | null;
  created_at: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  meeting_time: string;
  status: string;
  location: string | null;
  organizer_name: string;
  participants: any[];
}

export default function Communication() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Dialog states
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [_messageDialogOpen, _setMessageDialogOpen] = useState(false);
  const [_meetingDialogOpen, _setMeetingDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Form states
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState('media');
  const [announcementTargetAudience, setAnnouncementTargetAudience] = useState<string[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (tenantId && schoolId) {
      loadData();
    }
  }, [tenantId, schoolId]);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, school_id, id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id);
      } else {
        const { data: userTenant } = await supabase
          .from('user_tenants')
          .select('tenant_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (userTenant) {
          setTenantId(userTenant.tenant_id);
        }
      }

      if (profile?.school_id) {
        setSchoolId(profile.school_id);
      }

      if (profile?.id) {
        setUserId(profile.id);
      }
    } catch (error) {
      console.error('Erro ao inicializar:', error);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      if (!schoolId || !tenantId) return;

      // Carregar anúncios
      const { data: announcementsData, error: annError } = await supabase
        .from('announcements')
        .select(`
          *,
          author:author_id(full_name)
        `)
        .eq('school_id', schoolId)
        .order('is_pinned', { ascending: false })
        .order('publish_date', { ascending: false })
        .limit(50);

      if (annError) throw annError;

      setAnnouncements(
        (announcementsData || []).map(a => ({
          ...a,
          author_name: (typeof a.author === 'object' && a.author !== null && 'full_name' in a.author) ? (a.author as any).full_name : 'N/A',
        })) as unknown as Announcement[]
      );

      // Carregar mensagens
      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select(`
          *,
          from_user:from_user_id(full_name),
          to_user:to_user_id(full_name)
        `)
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (msgError) throw msgError;

      setMessages(
        (messagesData || []).map(m => ({
          ...m,
          from_user_name: (typeof m.from_user === 'object' && m.from_user !== null && 'full_name' in m.from_user) ? (m.from_user as any).full_name : 'N/A',
          to_user_name: (typeof m.to_user === 'object' && m.to_user !== null && 'full_name' in m.to_user) ? (m.to_user as any).full_name : null,
        })) as unknown as Message[]
      );

      // Carregar reuniões
      const { data: meetingsData, error: meetError } = await supabase
        .from('meeting_schedules')
        .select(`
          *,
          organizer:organizer_id(full_name)
        `)
        .eq('school_id', schoolId)
        .order('meeting_date', { ascending: true })
        .order('meeting_time', { ascending: true })
        .limit(50);

      if (meetError) throw meetError;

      setMeetings(
        (meetingsData || []).map(m => ({
          ...m,
          organizer_name: (typeof m.organizer === 'object' && m.organizer !== null && 'full_name' in m.organizer) ? (m.organizer as any).full_name : 'N/A',
        })) as unknown as Meeting[]
      );
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de comunicação',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAnnouncement() {
    if (!announcementTitle.trim() || !announcementContent.trim() || !schoolId || !tenantId || !userId) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      const { error } = await supabase.rpc('create_announcement', {
        p_school_id: schoolId,
        p_tenant_id: tenantId,
        p_author_id: userId,
        p_title: announcementTitle,
        p_content: announcementContent,
        p_target_audience: announcementTargetAudience,
        p_priority: announcementPriority,
        p_is_pinned: false,
        p_publish_date: new Date().toISOString(),
        p_expires_date: null,
        p_attachments: [],
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Anúncio criado com sucesso',
      });

      setAnnouncementDialogOpen(false);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementPriority('media');
      setAnnouncementTargetAudience([]);
      await loadData();
    } catch (error: any) {
      console.error('Erro ao criar anúncio:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar anúncio',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  const priorityColors: Record<string, string> = {
    baixa: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300',
    media: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    alta: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    urgente: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Comunicação Interna</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="announcements" className="space-y-4">
          <TabsList>
            <TabsTrigger value="announcements">
              <Bell className="h-4 w-4 mr-2" />
              Mural de Avisos
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Recados
            </TabsTrigger>
            <TabsTrigger value="meetings">
              <Calendar className="h-4 w-4 mr-2" />
              Reuniões
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Boletins
            </TabsTrigger>
          </TabsList>

          {/* Mural de Avisos */}
          <TabsContent value="announcements" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Mural de Avisos</h2>
              <Button onClick={() => setAnnouncementDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Anúncio
              </Button>
            </div>

            {announcements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum anúncio encontrado
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {announcements.map(announcement => (
                  <Card key={announcement.id} className={announcement.is_pinned ? 'border-primary' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {announcement.is_pinned && (
                              <Pin className="h-4 w-4 text-primary" />
                            )}
                            <CardTitle className="text-lg">{announcement.title}</CardTitle>
                            <Badge className={priorityColors[announcement.priority]}>
                              {announcement.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Por {announcement.author_name} • {format(new Date(announcement.publish_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recados */}
          <TabsContent value="messages" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Recados</h2>
              <Button onClick={() => _setMessageDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Recado
              </Button>
            </div>

            {messages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum recado encontrado
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {messages.map(message => (
                  <Card key={message.id} className={!message.is_read ? 'border-primary' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{message.subject}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {message.from_user_name === userId ? 'Para' : 'De'} {message.from_user_name === userId ? message.to_user_name : message.from_user_name} • {format(new Date(message.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        {!message.is_read && (
                          <Badge variant="default">Novo</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground whitespace-pre-wrap">{message.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reuniões */}
          <TabsContent value="meetings" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Reuniões Agendadas</h2>
              <Button onClick={() => _setMeetingDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agendar Reunião
              </Button>
            </div>

            {meetings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhuma reunião agendada
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {meetings.map(meeting => (
                  <Card key={meeting.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{meeting.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Organizado por {meeting.organizer_name} • {format(new Date(meeting.meeting_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {meeting.meeting_time}
                          </p>
                          {meeting.location && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Local: {meeting.location}
                            </p>
                          )}
                        </div>
                        <Badge>{meeting.status}</Badge>
                      </div>
                    </CardHeader>
                    {meeting.description && (
                      <CardContent>
                        <p className="text-foreground">{meeting.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Boletins */}
          <TabsContent value="reports" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Boletins Digitais</h2>
            </div>
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Funcionalidade de boletins em desenvolvimento
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Criar Anúncio */}
      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Anúncio</DialogTitle>
            <DialogDescription>
              Crie um anúncio para o mural da escola
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="announcementTitle">Título *</Label>
              <Input
                id="announcementTitle"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Título do anúncio"
                required
              />
            </div>

            <div>
              <Label htmlFor="announcementContent">Conteúdo *</Label>
              <Textarea
                id="announcementContent"
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder="Conteúdo do anúncio..."
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="announcementPriority">Prioridade</Label>
                <Select value={announcementPriority} onValueChange={setAnnouncementPriority}>
                  <SelectTrigger id="announcementPriority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setAnnouncementDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAnnouncement} disabled={processing}>
                {processing ? 'Publicando...' : 'Publicar Anúncio'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

