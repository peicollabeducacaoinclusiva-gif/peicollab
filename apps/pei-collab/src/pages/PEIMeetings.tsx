// ./src/pages/PEIMeetings.tsx
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { ArrowLeft, Plus, Calendar, MapPin, Users, Trash2, Edit, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Importação dos tipos Supabase
import type { Database } from "@/types/supabase"
type PeiMeetingRow = Database['public']['Tables']['pei_meetings']['Row'];
type PeiMeetingInsert = Database['public']['Tables']['pei_meetings']['Insert'];
type PeiMeetingUpdate = Database['public']['Tables']['pei_meetings']['Update'];
type PeiMeetingParticipantRow = Database['public']['Tables']['pei_meeting_participants']['Row'];
type PeiMeetingParticipantStatus = Database['public']['Enums']['pei_meeting_participant_status'] | string;
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Interface do Participante (Dados JOINED: pei_meeting_participants + profiles)
interface Participant extends PeiMeetingParticipantRow {
  user_name: string // Campo joined (profiles.full_name)
  user_role: string // Campo joined (user_roles.role)
}

// Interface da Reunião (Dados JOINED: pei_meetings + creator name + participants)
interface Meeting extends PeiMeetingRow {
  creator_name: string // Campo joined (profiles.full_name)
  participants: Participant[] // Array de participantes
}

interface PEIData {
  id: string
  status: string
  student?: {
    name: string
    date_of_birth: string | null
  } | null
}

const PEIMeetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [peiData, setPeiData] = useState<PEIData | null>(null)
  const { peiId } = useParams<{ peiId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)

  const [formData, setFormData] = useState<{
    title: string;
    scheduled_for: string;
    location_or_link: string;
    description: string;
  }>({
    title: "",
    scheduled_for: "",
    location_or_link: "",
    description: "",
  })

  useEffect(() => {
    if (peiId) {
      loadData()
    }
  }, [peiId])

  const loadData = async () => {
    try {
      // Buscar dados do PEI e do estudante
      const { data: peiRecord, error: peiError } = await supabase
        .from("peis")
        .select("id, status, student_id")
        .eq("id", peiId)
        .maybeSingle()

      if (peiError) throw peiError
      if (!peiRecord) throw new Error("PEI não encontrado")

      let studentInfo: PEIData["student"] = null
      if (peiRecord.student_id) {
        const { data: studentRecord, error: studentError } = await supabase
          .from("students")
          .select("name, date_of_birth")
          .eq("id", peiRecord.student_id)
          .maybeSingle()

        if (studentError) {
          console.warn("Não foi possível carregar o estudante:", studentError.message)
        } else if (studentRecord) {
          studentInfo = {
            name: studentRecord.name,
            date_of_birth: studentRecord.date_of_birth,
          }
        }
      }

      setPeiData({
        id: peiRecord.id,
        status: peiRecord.status,
        student: studentInfo,
      })

      // Buscar reuniões e participantes
      const { data: meetingsData, error: meetingsError } = await supabase
        .from("pei_meetings")
        .select("*")
        .eq("pei_id", peiId)
        .order("scheduled_for", { ascending: false })

      if (meetingsError) throw meetingsError
      if (!meetingsData || meetingsData.length === 0) {
        setMeetings([])
        return
      }

      const meetingIds = meetingsData.map((meeting: PeiMeetingRow) => meeting.id)

      const { data: participantsData, error: participantsError } = await supabase
        .from("pei_meeting_participants")
        .select("*")
        .in("meeting_id", meetingIds)

      if (participantsError) throw participantsError

      const profileIds = new Set<string>()
      meetingsData.forEach((meeting: PeiMeetingRow) => {
        if (meeting.created_by) profileIds.add(meeting.created_by)
      })
      participantsData?.forEach((participant) => {
        if (participant.user_id) profileIds.add(participant.user_id)
      })

      let profileMap = new Map<string, ProfileRow>()
      if (profileIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", Array.from(profileIds))

        if (profilesError) {
          console.warn("Não foi possível carregar perfis de participantes:", profilesError.message)
        } else if (profilesData) {
          profileMap = new Map(profilesData.map((profile) => [profile.id, profile as ProfileRow]))
        }
      }

      let roleMap = new Map<string, string>()
      if (profileIds.size > 0) {
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", Array.from(profileIds))

        if (rolesError) {
          console.warn("Não foi possível carregar roles dos participantes:", rolesError.message)
        } else if (rolesData) {
          roleMap = new Map(rolesData.map((role) => [role.user_id, role.role]))
        }
      }

      const participantsByMeeting = new Map<string, Participant[]>()
      participantsData?.forEach((participant) => {
        const participantProfile = profileMap.get(participant.user_id || "")
        const formattedParticipant: Participant = {
          ...participant,
          user_name: participantProfile?.full_name || "Desconhecido",
          user_role: roleMap.get(participant.user_id || "") || "",
        }
        const current = participantsByMeeting.get(participant.meeting_id) || []
        current.push(formattedParticipant)
        participantsByMeeting.set(participant.meeting_id, current)
      })

      const formattedMeetings: Meeting[] = meetingsData.map((meeting: any) => ({
        ...meeting,
        creator_name: profileMap.get(meeting.created_by || "")?.full_name || "Desconhecido",
        participants: participantsByMeeting.get(meeting.id) || [],
      }))

      setMeetings(formattedMeetings)
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro ao carregar dados",
        description: error.message || "Não foi possível carregar os dados das reuniões.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.scheduled_for.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e Data/Hora são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      if (editingMeeting) {
        // Atualizar reunião existente
        const updateData: PeiMeetingUpdate = {
          title: formData.title,
          scheduled_for: new Date(formData.scheduled_for).toISOString(),
          location_or_link: formData.location_or_link || null,
          description: formData.description || null,
        }
        const { error } = await supabase
          .from("pei_meetings")
          .update(updateData)
          .eq("id", editingMeeting.id)

        if (error) throw error

        toast({
          title: "Reunião atualizada",
          description: "A reunião foi atualizada com sucesso.",
        })
      } else {
        // Criar nova reunião
        const insertData: PeiMeetingInsert = {
          pei_id: peiId!,
          created_by: user.id,
          title: formData.title,
          scheduled_for: new Date(formData.scheduled_for).toISOString(),
          location_or_link: formData.location_or_link || null,
          description: formData.description || null,
        }
        const { error } = await supabase.from("pei_meetings").insert(insertData)

        if (error) throw error

        toast({
          title: "Reunião agendada",
          description: "Sua reunião foi agendada com sucesso.",
        })
      }

      handleDialogClose()
      loadData()
    } catch (error: any) {
      console.error("Erro ao salvar reunião:", error)
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a reunião.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setFormData({
      title: meeting.title,
      scheduled_for: new Date(meeting.scheduled_for).toISOString().slice(0, 16), // Formato para datetime-local
      location_or_link: meeting.location_or_link || "",
      description: meeting.description || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (meetingId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta reunião?")) return

    try {
      const { error } = await supabase.from("pei_meetings").delete().eq("id", meetingId)

      if (error) throw error

      toast({
        title: "Reunião excluída",
        description: "A reunião foi excluída com sucesso.",
      })

      loadData()
    } catch (error: any) {
      console.error("Erro ao excluir reunião:", error)
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a reunião.",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingMeeting(null)
    setFormData({
      title: "",
      scheduled_for: "",
      location_or_link: "",
      description: "",
    })
  }

  if (!peiData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>PEI não encontrado</CardTitle>
            <CardDescription>O PEI solicitado não foi encontrado.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Reuniões do PEI</h1>
          {peiData && (
            <Badge variant="outline" className="text-sm">
              {peiData.student?.name || "Estudante"}
            </Badge>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nova Reunião
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingMeeting ? "Editar Reunião" : "Agendar Nova Reunião"}</DialogTitle>
              <DialogDescription>
                {editingMeeting ? "Edite os detalhes da reunião." : "Preencha os detalhes para agendar uma reunião sobre o PEI."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Título</Label>
                  <Input id="title" placeholder="Reunião de Acompanhamento" className="col-span-3" value={formData.title} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="scheduled_for" className="text-right">Data/Hora</Label>
                  <Input id="scheduled_for" type="datetime-local" className="col-span-3" value={formData.scheduled_for} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location_or_link" className="text-right">Local/Link</Label>
                  <Input id="location_or_link" placeholder="Sala 101 ou Link Zoom" className="col-span-3" value={formData.location_or_link} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right">Descrição</Label>
                  <Textarea id="description" placeholder="Pauta: Metas do 1º Bimestre" className="col-span-3" value={formData.description} onChange={handleInputChange} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Salvando..." : (editingMeeting ? "Salvar Alterações" : "Agendar Reunião")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <main className="space-y-6">
        {meetings.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhuma reunião agendada para este PEI.</p>
        ) : (
          <div className="grid gap-4">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {meeting.title}
                      </CardTitle>
                      <CardDescription className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-2">
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(meeting.scheduled_for).toLocaleString()}
                        </span>
                        {meeting.location_or_link && (
                          <span className="flex items-center gap-1 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {meeting.location_or_link}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Criado por: {meeting.creator_name}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(meeting)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(meeting.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {meeting.description && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Descrição / Pauta:</h4>
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground">{meeting.description}</p>
                    </div>
                  )}
                  {meeting.participants.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Participantes:</h4>
                      <div className="flex flex-wrap gap-2">
                        {meeting.participants.map((participant) => (
                          <Badge key={participant.id} variant="secondary">
                            {participant.user_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            <strong>Dica:</strong> Use as reuniões para acompanhar o progresso do PEI, discutir estratégias com a equipe
            e envolver a família no processo educacional.
          </AlertDescription>
        </Alert>
      </main>
    </div>
  )
}

export default PEIMeetings