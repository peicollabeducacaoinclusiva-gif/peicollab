// ./src/pages/PEIOrientations.tsx
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
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
import { ArrowLeft, Plus, Stethoscope, Calendar, User, Trash2, Edit } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Importação dos tipos Supabase
import type { Database } from "@/types/supabase"
type PeiOrientationRow = Database["public"]["Tables"]["pei_specialist_orientations"]["Row"]
type PeiOrientationInsert = Database["public"]["Tables"]["pei_specialist_orientations"]["Insert"]
type PeiOrientationUpdate = Database["public"]["Tables"]["pei_specialist_orientations"]["Update"]
type PeiStatus = Database["public"]["Enums"]["pei_status"]
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

// Interface da Orientação (Dados JOINED: pei_specialist_orientations + profiles)
interface Orientation extends PeiOrientationRow {
  specialist_name: string // Campo joined (profiles.full_name)
}

// Interface de Dados do PEI (Dados JOINED: peis + students)
interface PEIData {
  id: string
  status: PeiStatus // Tipo ENUM correto
  student: {
    name: string
    date_of_birth: string | null
  }
}

const PEIOrientations = () => {
  const { peiId } = useParams<{ peiId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [peiData, setPeiData] = useState<PEIData | null>(null)
  const [orientations, setOrientations] = useState<Orientation[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get("add") === "true")
  const [editingOrientation, setEditingOrientation] = useState<Orientation | null>(null)

  const [formData, setFormData] = useState<{
    orientation_field: string;
    guidance: string;
  }>({
    orientation_field: "",
    guidance: "",
  })

  useEffect(() => {
    if (peiId) {
      loadData()
    }
  }, [peiId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Buscar dados do PEI
      const { data: peiResult, error: peiError } = await supabase
        .from("peis")
        .select(
          `
          id,
          status,
          student:students (
            name,
            date_of_birth
          )
        `,
        )
        .eq("id", peiId)
        .single()

      if (peiError) throw peiError
      setPeiData(peiResult as PEIData)

      // Buscar orientações - INCLUINDO pei_id no SELECT
      const { data: orientationsData, error: orientationsError } = await supabase
        .from("pei_specialist_orientations")
        .select("id, pei_id, orientation_field, guidance, created_at, updated_at, specialist_id")
        .eq("pei_id", peiId)
        .order("created_at", { ascending: false })

      if (orientationsError) throw orientationsError

      // Buscar nomes dos especialistas via profiles (specialist_id é FK para auth.users, mas profiles usa mesmo ID)
      const specialistIds = orientationsData?.map((o) => o.specialist_id) || []

      let profilesMap = new Map<string, string>()
      if (specialistIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", specialistIds)

        profilesMap = new Map(profilesData?.map((p) => [p.id, p.full_name]) || [])
      }

      const orientationsWithNames: Orientation[] = (orientationsData || []).map((o) => ({
        ...o,
        specialist_name: profilesMap.get(o.specialist_id) || "Especialista",
      }))

      setOrientations(orientationsWithNames)
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro ao carregar dados",
        description: error.message || "Não foi possível carregar os dados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.orientation_field.trim() || !formData.guidance.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      if (editingOrientation) {
        // Atualizar orientação existente
        const updateData: PeiOrientationUpdate = {
          orientation_field: formData.orientation_field,
          guidance: formData.guidance,
          updated_at: new Date().toISOString(),
        }
        const { error } = await supabase
          .from("pei_specialist_orientations")
          .update(updateData)
          .eq("id", editingOrientation.id)

        if (error) throw error

        toast({
          title: "Orientação atualizada",
          description: "A orientação foi atualizada com sucesso.",
        })
      } else {
        // Criar nova orientação
        const insertData: PeiOrientationInsert = {
          pei_id: peiId!,
          specialist_id: user.id,
          orientation_field: formData.orientation_field,
          guidance: formData.guidance,
        }
        const { error } = await supabase.from("pei_specialist_orientations").insert(insertData)

        if (error) throw error

        toast({
          title: "Orientação registrada",
          description: "Sua orientação foi registrada com sucesso.",
        })
      }

      // Resetar formulário e recarregar dados
      handleDialogClose()
      loadData()
    } catch (error: any) {
      console.error("Erro ao salvar orientação:", error)
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a orientação.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (orientation: Orientation) => {
    setEditingOrientation(orientation)
    setFormData({
      orientation_field: orientation.orientation_field,
      guidance: orientation.guidance,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (orientationId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta orientação?")) return

    try {
      const { error } = await supabase.from("pei_specialist_orientations").delete().eq("id", orientationId)

      if (error) throw error

      toast({
        title: "Orientação excluída",
        description: "A orientação foi excluída com sucesso.",
      })

      loadData()
    } catch (error: any) {
      console.error("Erro ao excluir orientação:", error)
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a orientação.",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingOrientation(null)
    setFormData({ orientation_field: "", guidance: "" })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold">
            Orientações de Especialistas para o PEI
          </h1>
          {peiData && (
            <Badge variant="outline" className="text-sm">
              {peiData.student.name}
            </Badge>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nova Orientação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingOrientation ? "Editar Orientação" : "Registrar Nova Orientação"}</DialogTitle>
              <DialogDescription>
                {editingOrientation ? "Edite os detalhes da orientação." : "Compartilhe suas recomendações para o PEI."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="orientation_field" className="text-right">Área</Label>
                  <Input id="orientation_field" placeholder="Ex: Fonoaudiologia" className="col-span-3" value={formData.orientation_field} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="guidance" className="text-right">Orientação</Label>
                  <Textarea id="guidance" placeholder="Recomendo 3 sessões semanais..." rows={5} className="col-span-3" value={formData.guidance} onChange={handleInputChange} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Salvando..." : (editingOrientation ? "Salvar Alterações" : "Salvar Orientação")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <main className="space-y-6">
        {orientations.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhuma orientação registrada. Seja o primeiro a contribuir!</p>
        ) : (
          <div className="grid gap-4">
            {orientations.map((orientation) => (
              <Card key={orientation.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-primary" />
                        {orientation.orientation_field}
                      </CardTitle>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {orientation.specialist_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(orientation.created_at).toLocaleDateString()}
                        </span>
                        {orientation.updated_at && orientation.updated_at !== orientation.created_at && (
                          <span className="text-xs">(Editado)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(orientation)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(orientation.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-sm">{orientation.guidance}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Alert>
          <Stethoscope className="h-4 w-4" />
          <AlertDescription>
            <strong>Dica:</strong> Suas orientações são visíveis para coordenadores, gestores escolares e professores
            responsáveis pelo PEI. Seja claro e específico em suas recomendações para auxiliar no desenvolvimento do
            aluno.
          </AlertDescription>
        </Alert>
      </main>
    </div>
  )
}

export default PEIOrientations