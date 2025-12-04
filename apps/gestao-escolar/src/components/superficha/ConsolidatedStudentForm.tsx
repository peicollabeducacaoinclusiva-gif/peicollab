import { User, Calendar, Mail, Phone, MapPin, Users, BookOpen, Heart, FileText } from 'lucide-react';
import { CompleteStudentProfile } from '../../services/superfichaService';
import { FieldGroup } from './FieldGroup';
import { IncrementalEditField } from './IncrementalEditField';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConsolidatedStudentFormProps {
  profile: CompleteStudentProfile;
  studentId: string;
  className?: string;
}

export function ConsolidatedStudentForm({
  profile,
  studentId,
  className,
}: ConsolidatedStudentFormProps) {
  const student = profile.student;
  const school = profile.school;
  const currentEnrollment = profile.current_enrollment;

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Grupo 1: Identificação Básica */}
      <FieldGroup
        title="Identificação"
        description="Dados de identificação do estudante"
        icon={<User className="h-5 w-5" />}
      >
        <IncrementalEditField
          studentId={studentId}
          fieldName="name"
          label="Nome Completo"
          value={student.name}
          type="text"
        />
        <IncrementalEditField
          studentId={studentId}
          fieldName="date_of_birth"
          label="Data de Nascimento"
          value={student.date_of_birth ? format(new Date(student.date_of_birth), 'yyyy-MM-dd') : undefined}
          type="date"
        />
        {student.registration_number && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Registro Acadêmico (RA)</label>
            <p className="text-base">{student.registration_number}</p>
          </div>
        )}
      </FieldGroup>

      {/* Grupo 2: Contatos */}
      <FieldGroup
        title="Contatos"
        description="Informações de contato do estudante"
        icon={<Phone className="h-5 w-5" />}
      >
        <IncrementalEditField
          studentId={studentId}
          fieldName="email"
          label="E-mail"
          value={student.email}
          type="email"
          placeholder="estudante@email.com"
        />
        <IncrementalEditField
          studentId={studentId}
          fieldName="phone"
          label="Telefone"
          value={student.phone}
          type="tel"
          placeholder="(00) 00000-0000"
        />
      </FieldGroup>

      {/* Grupo 3: Dados Familiares */}
      <FieldGroup
        title="Família"
        description="Informações sobre os responsáveis"
        icon={<Users className="h-5 w-5" />}
      >
        <IncrementalEditField
          studentId={studentId}
          fieldName="mother_name"
          label="Nome da Mãe"
          value={student.mother_name}
          type="text"
        />
        <IncrementalEditField
          studentId={studentId}
          fieldName="father_name"
          label="Nome do Pai"
          value={student.father_name}
          type="text"
        />
      </FieldGroup>

      {/* Grupo 4: Endereço */}
      <FieldGroup
        title="Endereço"
        description="Localização do estudante"
        icon={<MapPin className="h-5 w-5" />}
      >
        <IncrementalEditField
          studentId={studentId}
          fieldName="address"
          label="Endereço"
          value={student.address}
          type="text"
        />
        <IncrementalEditField
          studentId={studentId}
          fieldName="city"
          label="Cidade"
          value={student.city}
          type="text"
        />
        <IncrementalEditField
          studentId={studentId}
          fieldName="state"
          label="Estado"
          value={student.state}
          type="text"
          placeholder="UF"
        />
        <IncrementalEditField
          studentId={studentId}
          fieldName="zip_code"
          label="CEP"
          value={student.zip_code}
          type="text"
          placeholder="00000-000"
        />
      </FieldGroup>

      {/* Grupo 5: Dados Escolares (Somente leitura) */}
      <FieldGroup
        title="Dados Escolares"
        description="Informações sobre a matrícula e escola"
        icon={<BookOpen className="h-5 w-5" />}
      >
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Escola</label>
          <p className="text-base">{school.school_name}</p>
        </div>
        {currentEnrollment?.grade && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Série/Turma</label>
            <p className="text-base">{currentEnrollment.grade}</p>
          </div>
        )}
        {currentEnrollment?.shift && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Turno</label>
            <p className="text-base">{currentEnrollment.shift}</p>
          </div>
        )}
        {currentEnrollment?.academic_year && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Ano Letivo</label>
            <p className="text-base">{currentEnrollment.academic_year}</p>
          </div>
        )}
      </FieldGroup>

      {/* Grupo 6: Informações Adicionais */}
      {(student.necessidades_especiais || student.tipo_necessidade) && (
        <FieldGroup
          title="Necessidades Especiais"
          description="Informações sobre necessidades educacionais especiais"
          icon={<Heart className="h-5 w-5" />}
          columns={1}
        >
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Possui NEE</label>
              <p className="text-base">{student.necessidades_especiais ? 'Sim' : 'Não'}</p>
            </div>
            {student.tipo_necessidade && student.tipo_necessidade.length > 0 && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Tipos de NEE</label>
                <div className="flex flex-wrap gap-2">
                  {student.tipo_necessidade.map((tipo, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                    >
                      {tipo}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </FieldGroup>
      )}
    </div>
  );
}

