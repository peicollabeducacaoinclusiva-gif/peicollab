"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Calendar, Users, GraduationCap, School, Building2 } from "lucide-react"
import { StudentContextData } from "@/types/pei"

interface StudentContextSectionProps {
  contextData: StudentContextData
  onContextChange: (data: StudentContextData) => void
  studentAge?: number
  studentEnrollment?: {
    grade?: string
    class_name?: string
    enrollment_date?: string
  }
}

const StudentContextSection = ({
  contextData,
  onContextChange,
  studentAge,
  studentEnrollment,
}: StudentContextSectionProps) => {
  const handleChange = (field: keyof StudentContextData, value: any) => {
    onContextChange({
      ...contextData,
      [field]: value,
    })
  }

  const handleNestedChange = (section: 'professionals' | 'family' | 'schooling_history', field: string, value: any) => {
    onContextChange({
      ...contextData,
      [section]: {
        ...(contextData[section] as any),
        [field]: value,
      },
    })
  }

  const addPreviousSchool = () => {
    const history = contextData.schooling_history || {}
    const previousSchools = history.previous_schools || []
    handleNestedChange('schooling_history', 'previous_schools', [
      ...previousSchools,
      { school_name: '', period: '', grade: '' },
    ])
  }

  const removePreviousSchool = (index: number) => {
    const history = contextData.schooling_history || {}
    const previousSchools = history.previous_schools || []
    handleNestedChange('schooling_history', 'previous_schools', previousSchools.filter((_, i) => i !== index))
  }

  const updatePreviousSchool = (index: number, field: string, value: string) => {
    const history = contextData.schooling_history || {}
    const previousSchools = [...(history.previous_schools || [])]
    previousSchools[index] = { ...previousSchools[index], [field]: value }
    handleNestedChange('schooling_history', 'previous_schools', previousSchools)
  }

  const addRepetition = () => {
    const history = contextData.schooling_history || {}
    const repetitions = history.repetitions || []
    handleNestedChange('schooling_history', 'repetitions', [
      ...repetitions,
      { year: '', grade: '' },
    ])
  }

  const removeRepetition = (index: number) => {
    const history = contextData.schooling_history || {}
    const repetitions = history.repetitions || []
    handleNestedChange('schooling_history', 'repetitions', repetitions.filter((_, i) => i !== index))
  }

  const addTechnicalTeamMember = () => {
    const professionals = contextData.professionals || {}
    const technicalTeam = professionals.technical_team || []
    handleNestedChange('professionals', 'technical_team', [...technicalTeam, ''])
  }

  const removeTechnicalTeamMember = (index: number) => {
    const professionals = contextData.professionals || {}
    const technicalTeam = professionals.technical_team || []
    handleNestedChange('professionals', 'technical_team', technicalTeam.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Identificação e Contexto Expandido</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Complete todas as informações sobre o aluno, família, escola e profissionais envolvidos
        </p>
      </div>

      {/* Dados Escolares */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <School className="h-5 w-5 text-primary" />
            Dados Escolares
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                type="number"
                value={studentAge || contextData.age || ''}
                onChange={(e) => handleChange('age', parseInt(e.target.value) || undefined)}
                placeholder="Ex: 10"
                disabled={!!studentAge}
              />
              {studentAge && (
                <p className="text-xs text-muted-foreground mt-1">Calculada automaticamente</p>
              )}
            </div>

            <div>
              <Label htmlFor="grade">Ano/Série *</Label>
              <Input
                id="grade"
                value={studentEnrollment?.grade || contextData.grade || ''}
                onChange={(e) => handleChange('grade', e.target.value)}
                placeholder="Ex: 3º Ano EF"
              />
            </div>

            <div>
              <Label htmlFor="class">Turma *</Label>
              <Input
                id="class"
                value={studentEnrollment?.class_name || contextData.class || ''}
                onChange={(e) => handleChange('class', e.target.value)}
                placeholder="Ex: A, B"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="enrollment_date">Data de Ingresso na Escola</Label>
              <Input
                id="enrollment_date"
                type="date"
                value={studentEnrollment?.enrollment_date || contextData.enrollment_date || ''}
                onChange={(e) => handleChange('enrollment_date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="teaching_modality">Modalidade de Ensino *</Label>
              <Select
                value={contextData.teaching_modality || ''}
                onValueChange={(value) => handleChange('teaching_modality', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a modalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Educação Infantil">Educação Infantil</SelectItem>
                  <SelectItem value="Ensino Fundamental Anos Iniciais">Ensino Fundamental Anos Iniciais</SelectItem>
                  <SelectItem value="Ensino Fundamental Anos Finais">Ensino Fundamental Anos Finais</SelectItem>
                  <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                  <SelectItem value="EJA - Educação de Jovens e Adultos">EJA - Educação de Jovens e Adultos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="school_address">Endereço Completo da Escola</Label>
            <Textarea
              id="school_address"
              value={contextData.school_address || ''}
              onChange={(e) => handleChange('school_address', e.target.value)}
              placeholder="Rua, número, bairro, cidade, CEP"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pei_period">Período de Vigência do PEI</Label>
              <Input
                id="pei_period"
                value={contextData.pei_period || ''}
                onChange={(e) => handleChange('pei_period', e.target.value)}
                placeholder="Ex: 2025.2"
              />
            </div>

            <div>
              <Label htmlFor="pei_review_date">Data Prevista para Revisão</Label>
              <Input
                id="pei_review_date"
                type="date"
                value={contextData.pei_review_date || ''}
                onChange={(e) => handleChange('pei_review_date', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profissionais Envolvidos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Profissionais Envolvidos
          </CardTitle>
          <CardDescription>
            Identifique todos os profissionais que atuam com o aluno
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="regent_teacher">Professor Regente</Label>
              <Input
                id="regent_teacher"
                value={contextData.professionals?.regent_teacher || ''}
                onChange={(e) => handleNestedChange('professionals', 'regent_teacher', e.target.value)}
                placeholder="Nome completo do professor"
              />
            </div>

            <div>
              <Label htmlFor="aee_teacher">Professor AEE</Label>
              <Input
                id="aee_teacher"
                value={contextData.professionals?.aee_teacher || ''}
                onChange={(e) => handleNestedChange('professionals', 'aee_teacher', e.target.value)}
                placeholder="Nome completo do professor AEE"
              />
            </div>

            <div>
              <Label htmlFor="assistant">Auxiliar</Label>
              <Input
                id="assistant"
                value={contextData.professionals?.assistant || ''}
                onChange={(e) => handleNestedChange('professionals', 'assistant', e.target.value)}
                placeholder="Nome do auxiliar"
              />
            </div>

            <div>
              <Label htmlFor="coordinator">Coordenador</Label>
              <Input
                id="coordinator"
                value={contextData.professionals?.coordinator || ''}
                onChange={(e) => handleNestedChange('professionals', 'coordinator', e.target.value)}
                placeholder="Nome do coordenador"
              />
            </div>

            <div>
              <Label htmlFor="principal">Diretor</Label>
              <Input
                id="principal"
                value={contextData.professionals?.principal || ''}
                onChange={(e) => handleNestedChange('professionals', 'principal', e.target.value)}
                placeholder="Nome do diretor"
              />
            </div>
          </div>

          <div>
            <Label>Equipe Técnica (Psicólogo, Fonoaudiólogo, etc.)</Label>
            {(contextData.professionals?.technical_team || []).map((member, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={member}
                  onChange={(e) => {
                    const team = [...(contextData.professionals?.technical_team || [])]
                    team[index] = e.target.value
                    handleNestedChange('professionals', 'technical_team', team)
                  }}
                  placeholder="Ex: Psicólogo - Dr. João Silva"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTechnicalTeamMember(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTechnicalTeamMember}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Membro da Equipe Técnica
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dados Familiares */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Dados Familiares
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="father_name">Nome do Pai</Label>
              <Input
                id="father_name"
                value={contextData.family?.father_name || ''}
                onChange={(e) => handleNestedChange('family', 'father_name', e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <Label htmlFor="mother_name">Nome da Mãe</Label>
              <Input
                id="mother_name"
                value={contextData.family?.mother_name || ''}
                onChange={(e) => handleNestedChange('family', 'mother_name', e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <Label htmlFor="guardian_name">Responsável Legal (se diferente)</Label>
              <Input
                id="guardian_name"
                value={contextData.family?.guardian_name || ''}
                onChange={(e) => handleNestedChange('family', 'guardian_name', e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <Label htmlFor="contact_phone">Telefone de Contato</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={contextData.family?.contact_phone || ''}
                onChange={(e) => handleNestedChange('family', 'contact_phone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Label htmlFor="contact_email">E-mail de Contato</Label>
              <Input
                id="contact_email"
                type="email"
                value={contextData.family?.contact_email || ''}
                onChange={(e) => handleNestedChange('family', 'contact_email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="family_address">Endereço da Família</Label>
              <Input
                id="family_address"
                value={contextData.family?.family_address || ''}
                onChange={(e) => handleNestedChange('family', 'family_address', e.target.value)}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            <div>
              <Label htmlFor="father_education">Escolaridade do Pai</Label>
              <Select
                value={contextData.family?.father_education || ''}
                onValueChange={(value) => handleNestedChange('family', 'father_education', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ensino Fundamental Incompleto">Ensino Fundamental Incompleto</SelectItem>
                  <SelectItem value="Ensino Fundamental Completo">Ensino Fundamental Completo</SelectItem>
                  <SelectItem value="Ensino Médio Incompleto">Ensino Médio Incompleto</SelectItem>
                  <SelectItem value="Ensino Médio Completo">Ensino Médio Completo</SelectItem>
                  <SelectItem value="Ensino Superior Incompleto">Ensino Superior Incompleto</SelectItem>
                  <SelectItem value="Ensino Superior Completo">Ensino Superior Completo</SelectItem>
                  <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mother_education">Escolaridade da Mãe</Label>
              <Select
                value={contextData.family?.mother_education || ''}
                onValueChange={(value) => handleNestedChange('family', 'mother_education', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ensino Fundamental Incompleto">Ensino Fundamental Incompleto</SelectItem>
                  <SelectItem value="Ensino Fundamental Completo">Ensino Fundamental Completo</SelectItem>
                  <SelectItem value="Ensino Médio Incompleto">Ensino Médio Incompleto</SelectItem>
                  <SelectItem value="Ensino Médio Completo">Ensino Médio Completo</SelectItem>
                  <SelectItem value="Ensino Superior Incompleto">Ensino Superior Incompleto</SelectItem>
                  <SelectItem value="Ensino Superior Completo">Ensino Superior Completo</SelectItem>
                  <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="family_dynamics">Convívio Familiar</Label>
            <Textarea
              id="family_dynamics"
              value={contextData.family?.family_dynamics || ''}
              onChange={(e) => handleNestedChange('family', 'family_dynamics', e.target.value)}
              placeholder="Breve descrição do convívio familiar, dinâmica da família, participação na vida escolar..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Escolarização */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Histórico de Escolarização
          </CardTitle>
          <CardDescription>
            Registre a trajetória escolar do aluno
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Escolas Anteriores</Label>
            {(contextData.schooling_history?.previous_schools || []).map((school, index) => (
              <Card key={index} className="mt-2">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Escola {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePreviousSchool(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      placeholder="Nome da escola"
                      value={school.school_name}
                      onChange={(e) => updatePreviousSchool(index, 'school_name', e.target.value)}
                    />
                    <Input
                      placeholder="Período (ex: 2020-2022)"
                      value={school.period}
                      onChange={(e) => updatePreviousSchool(index, 'period', e.target.value)}
                    />
                    <Input
                      placeholder="Série/Ano"
                      value={school.grade}
                      onChange={(e) => updatePreviousSchool(index, 'grade', e.target.value)}
                    />
                  </div>
                  <Textarea
                    placeholder="Observações sobre esta escola"
                    value={school.observations || ''}
                    onChange={(e) => updatePreviousSchool(index, 'observations', e.target.value)}
                    rows={2}
                  />
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPreviousSchool}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Escola Anterior
            </Button>
          </div>

          <div>
            <Label htmlFor="previous_advances">Avanços em Anos Anteriores</Label>
            <Textarea
              id="previous_advances"
              value={contextData.schooling_history?.previous_advances || ''}
              onChange={(e) => handleNestedChange('schooling_history', 'previous_advances', e.target.value)}
              placeholder="Descreva os avanços e conquistas do aluno em anos anteriores..."
              rows={3}
            />
          </div>

          <div>
            <Label>Repetições de Ano</Label>
            {(contextData.schooling_history?.repetitions || []).map((rep, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  placeholder="Ano (ex: 2023)"
                  value={rep.year}
                  onChange={(e) => {
                    const reps = [...(contextData.schooling_history?.repetitions || [])]
                    reps[index] = { ...reps[index], year: e.target.value }
                    handleNestedChange('schooling_history', 'repetitions', reps)
                  }}
                />
                <Input
                  placeholder="Série/Ano repetido"
                  value={rep.grade}
                  onChange={(e) => {
                    const reps = [...(contextData.schooling_history?.repetitions || [])]
                    reps[index] = { ...reps[index], grade: e.target.value }
                    handleNestedChange('schooling_history', 'repetitions', reps)
                  }}
                />
                <Input
                  placeholder="Motivo (opcional)"
                  value={rep.reason || ''}
                  onChange={(e) => {
                    const reps = [...(contextData.schooling_history?.repetitions || [])]
                    reps[index] = { ...reps[index], reason: e.target.value }
                    handleNestedChange('schooling_history', 'repetitions', reps)
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRepetition(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRepetition}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Repetição
            </Button>
          </div>

          <div>
            <Label htmlFor="schooling_summary">Resumo da Trajetória Escolar</Label>
            <Textarea
              id="schooling_summary"
              value={contextData.schooling_history?.summary || ''}
              onChange={(e) => handleNestedChange('schooling_history', 'summary', e.target.value)}
              placeholder="Resumo geral da trajetória escolar do aluno, incluindo avanços, dificuldades, mudanças de escola, etc."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentContextSection

