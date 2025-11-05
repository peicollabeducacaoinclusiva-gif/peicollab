"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, FileText, Calendar, Users, Eye, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface SpecialistDashboardProps {
  profile: {
    id: string
    full_name: string
    role: string
    school_id: string | null
  }
}

interface PEIWithStudent {
  id: string
  status: string
  created_at: string
  student: {
    id: string
    name: string
    date_of_birth: string | null
  }
  orientations_count: number
}

const SpecialistDashboard = ({ profile }: SpecialistDashboardProps) => {
  const [peis, setPeis] = useState<PEIWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPEIs: 0,
    totalOrientations: 0,
    pendingPEIs: 0,
  })
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    loadSpecialistData()
  }, [profile.id])

  const loadSpecialistData = async () => {
    try {
      setLoading(true)

      // Buscar PEIs onde o especialista tem orientações
      const { data: orientationsData, error: orientationsError } = await supabase
        .from("pei_specialist_orientations")
        .select("pei_id")
        .eq("specialist_id", profile.id)

      if (orientationsError) throw orientationsError

      const peiIds = [...new Set(orientationsData?.map((o) => o.pei_id) || [])]

      if (peiIds.length === 0) {
        setPeis([])
        setStats({ totalPEIs: 0, totalOrientations: 0, pendingPEIs: 0 })
        setLoading(false)
        return
      }

      // Buscar detalhes dos PEIs
      const { data: peisData, error: peisError } = await supabase
        .from("peis")
        .select(
          `
          id,
          status,
          created_at,
          student:students (
            id,
            name,
            date_of_birth
          )
        `,
        )
        .in("id", peiIds)
        .eq("is_active_version", true)
        .order("created_at", { ascending: false })

      if (peisError) throw peisError

      // Contar orientações por PEI
      const peisWithCounts = await Promise.all(
        (peisData || []).map(async (pei) => {
          const { count } = await supabase
            .from("pei_specialist_orientations")
            .select("*", { count: "exact", head: true })
            .eq("pei_id", pei.id)
            .eq("specialist_id", profile.id)

          return {
            ...pei,
            orientations_count: count || 0,
          }
        }),
      )

      setPeis(peisWithCounts as PEIWithStudent[])

      // Calcular estatísticas
      const totalOrientations = peisWithCounts.reduce((sum, pei) => sum + pei.orientations_count, 0)
      const pendingPEIs = peisWithCounts.filter((pei) => pei.status === "pending" || pei.status === "draft").length

      setStats({
        totalPEIs: peisWithCounts.length,
        totalOrientations,
        pendingPEIs,
      })
    } catch (error: any) {
      console.error("Erro ao carregar dados do especialista:", error)
      toast({
        title: "Erro ao carregar dados",
        description: error.message || "Não foi possível carregar os dados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Rascunho", variant: "secondary" },
      pending: { label: "Pendente", variant: "outline" },
      approved: { label: "Aprovado", variant: "default" },
      returned: { label: "Devolvido", variant: "destructive" },
    }

    const statusInfo = statusMap[status] || { label: status, variant: "outline" }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return "N/A"
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return `${age} anos`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard do Especialista</h1>
        <p className="text-muted-foreground mt-2">
          Bem-vindo, {profile.full_name}. Gerencie suas orientações para os PEIs.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de PEIs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPEIs}</div>
            <p className="text-xs text-muted-foreground">PEIs sob sua orientação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orientações Registradas</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrientations}</div>
            <p className="text-xs text-muted-foreground">Total de orientações fornecidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PEIs Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPEIs}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>
      </div>

      {/* PEIs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Meus PEIs para Orientação
          </CardTitle>
          <CardDescription>
            Lista de todos os PEIs onde você está registrado como especialista orientador
          </CardDescription>
        </CardHeader>
        <CardContent>
          {peis.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum PEI atribuído</h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não foi atribuído a nenhum PEI como especialista orientador.
              </p>
              <p className="text-sm text-muted-foreground">
                Entre em contato com o coordenador para ser adicionado aos PEIs que necessitam de sua especialidade.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {peis.map((pei) => (
                <Card key={pei.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{pei.student.name}</h3>
                          {getStatusBadge(pei.status)}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>Idade: {calculateAge(pei.student.date_of_birth)}</p>
                          <p>Criado em: {new Date(pei.created_at).toLocaleDateString("pt-BR")}</p>
                          <p className="flex items-center gap-1">
                            <Stethoscope className="h-3 w-3" />
                            {pei.orientations_count} orientação(ões) registrada(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/pei/${pei.id}/orientations`)}
                          className="whitespace-nowrap"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Orientações
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/pei/${pei.id}/orientations?add=true`)}
                          className="whitespace-nowrap"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Orientação
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Sobre o papel de Especialista</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p>
            Como especialista, você desempenha um papel fundamental no desenvolvimento dos alunos, fornecendo
            orientações especializadas em sua área de atuação.
          </p>
          <p>
            Suas orientações ajudam professores e coordenadores a criar estratégias mais eficazes e personalizadas para
            cada aluno.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Registre orientações detalhadas para cada PEI</li>
            <li>Acompanhe o progresso dos alunos através das atualizações</li>
            <li>Colabore com a equipe pedagógica para melhores resultados</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default SpecialistDashboard
