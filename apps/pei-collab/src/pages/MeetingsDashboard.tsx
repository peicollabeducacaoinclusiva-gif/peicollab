// src/pages/MeetingsDashboard.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/shared/PageLayout";
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  Plus, 
  Search,
  CheckCircle,
  AlertCircle,
  XCircle 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Meeting {
  id: string;
  meeting_date: string;
  meeting_type: string;
  title: string;
  description: string;
  status: string;
  location: string;
  created_by: string;
  created_at: string;
  completed_at: string | null;
}

export default function MeetingsDashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🎯 MeetingsDashboard montado');
    loadMeetings();
  }, []);

  useEffect(() => {
    filterMeetings();
  }, [meetings, searchTerm, activeTab]);

  const loadMeetings = async () => {
    console.log('📥 Carregando reuniões...');
    try {
      const { data, error } = await supabase
        .from('pei_meetings')
        .select('*')
        .order('meeting_date', { ascending: true });

      console.log('📊 Dados recebidos:', data);
      console.log('❌ Erro:', error);

      if (error) {
        console.error('Erro ao carregar reuniões:', error);
        setError(error.message);
      } else {
        setMeetings(data || []);
        setError(null);
      }
    } catch (error: any) {
      console.error('Exceção ao carregar reuniões:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
      console.log('✅ Carregamento finalizado');
    }
  };

  const filterMeetings = () => {
    let filtered = meetings;

    // Filtrar por tab
    const now = new Date();
    if (activeTab === "upcoming") {
      filtered = filtered.filter(
        (m) => m.status === "scheduled" && new Date(m.meeting_date) >= now
      );
    } else if (activeTab === "completed") {
      filtered = filtered.filter((m) => m.status === "completed");
    } else if (activeTab === "cancelled") {
      filtered = filtered.filter((m) => m.status === "cancelled");
    }

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter((m) =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMeetings(filtered);
  };

  const getMeetingTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      inicial: "Inicial",
      acompanhamento: "Acompanhamento",
      final: "Final",
      extraordinaria: "Extraordinária",
    };
    return types[type] || type;
  };

  const getMeetingTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      inicial: "bg-blue-500",
      acompanhamento: "bg-green-500",
      final: "bg-purple-500",
      extraordinaria: "bg-red-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const getStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === "cancelled") return <XCircle className="h-4 w-4 text-red-600" />;
    return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: "Agendada",
      in_progress: "Em Andamento",
      completed: "Concluída",
      cancelled: "Cancelada",
    };
    return labels[status] || status;
  };

  console.log('🖥️ Renderizando MeetingsDashboard', { isLoading, meetings: meetings.length, error });

  if (isLoading) {
    return (
      <PageLayout title="Reuniões de PEI">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando reuniões...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Reuniões de PEI">
      <div className="container mx-auto p-6 space-y-6">
      {/* Debug Info */}
      {error && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-sm text-orange-800">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-orange-700">Erro: {error}</p>
            <p className="text-xs text-orange-600 mt-2">
              As migrações SQL foram aplicadas corretamente?
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reuniões de PEI</h1>
          <p className="text-muted-foreground">
            Gerencie reuniões e registre atas estruturadas
          </p>
        </div>
        <Button onClick={() => navigate("/meetings/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Reunião
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Reuniões cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetings.filter((m) => m.status === "scheduled").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando realização</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetings.filter((m) => m.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Com ata registrada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                meetings.filter(
                  (m) =>
                    new Date(m.meeting_date).getMonth() === new Date().getMonth()
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">Reuniões do mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Reuniões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            Agendadas ({filteredMeetings.filter(m => m.status === 'scheduled').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídas ({filteredMeetings.filter(m => m.status === 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Canceladas ({filteredMeetings.filter(m => m.status === 'cancelled').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredMeetings.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhuma reunião encontrada</p>
                  <p className="text-sm mt-2">
                    {activeTab === 'upcoming' 
                      ? 'Clique em "Nova Reunião" para agendar a primeira reunião.'
                      : 'Nenhuma reunião nesta categoria ainda.'}
                  </p>
                  {activeTab === 'upcoming' && (
                    <Button 
                      className="mt-4" 
                      onClick={() => navigate("/meetings/create")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeira Reunião
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredMeetings.map((meeting) => (
                <Card
                  key={meeting.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    if (meeting.status === "completed") {
                      navigate(`/meetings/${meeting.id}/minutes`);
                    } else {
                      navigate(`/meetings/${meeting.id}/minutes`);
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`h-2 w-2 rounded-full ${getMeetingTypeColor(
                              meeting.meeting_type
                            )}`}
                          />
                          <Badge variant="outline">
                            {getMeetingTypeLabel(meeting.meeting_type)}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(meeting.status)}
                            <span className="text-xs text-muted-foreground">
                              {getStatusLabel(meeting.status)}
                            </span>
                          </div>
                        </div>
                        <CardTitle className="text-xl">{meeting.title}</CardTitle>
                        {meeting.description && (
                          <CardDescription className="mt-2">
                            {meeting.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Data</p>
                          <p className="text-muted-foreground">
                            {format(new Date(meeting.meeting_date), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Horário</p>
                          <p className="text-muted-foreground">
                            {format(new Date(meeting.meeting_date), "HH:mm")}
                          </p>
                        </div>
                      </div>
                      {meeting.location && (
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">Local</p>
                            <p className="text-muted-foreground">{meeting.location}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </PageLayout>
  );
}
