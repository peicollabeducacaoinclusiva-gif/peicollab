import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  User,
  Calendar,
  Mail,
  Phone,
  School,
  FileText,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CompleteStudentProfile, RiskIndicators, StudentSuggestions } from '../../services/superfichaService';
import { RiskIndicators as RiskIndicatorsComponent } from './RiskIndicators';
import { SuggestionsPanel } from './SuggestionsPanel';
import { cn } from '@/lib/utils';

interface IntelligentSummaryProps {
  profile: CompleteStudentProfile;
  risks?: RiskIndicators | null;
  suggestions?: StudentSuggestions | null;
  studentId: string;
  className?: string;
}

export function IntelligentSummary({
  profile,
  risks,
  suggestions,
  studentId,
  className,
}: IntelligentSummaryProps) {
  const student = profile.student;
  const school = profile.school;
  const tenant = profile.tenant;
  const activePei = profile.active_pei;
  const activeAee = profile.active_aee;
  const currentEnrollment = profile.current_enrollment;

  const initials = (student.name || '')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const overallRiskLevel = risks?.overall_risk || 'unknown';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Card Principal do Estudante */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{student.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {student.registration_number && (
                    <Badge variant="outline">RA: {student.registration_number}</Badge>
                  )}
                  {activePei && (
                    <Badge className="bg-blue-600 hover:bg-blue-700">
                      PEI Ativo
                    </Badge>
                  )}
                  {activeAee && (
                    <Badge className="bg-green-600 hover:bg-green-700">
                      AEE Ativo
                    </Badge>
                  )}
                  {student.necessidades_especiais && (
                    <Badge className="bg-purple-600 hover:bg-purple-700">
                      NEE
                    </Badge>
                  )}
                  {overallRiskLevel === 'high' && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Alto Risco
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dados Pessoais */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Dados Pessoais
              </h3>
              <div className="space-y-2">
                {student.date_of_birth && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Nascimento:</span>
                    <span>
                      {format(new Date(student.date_of_birth), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                )}
                {student.mother_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Mãe:</span>
                    <span>{student.mother_name}</span>
                  </div>
                )}
                {student.father_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Pai:</span>
                    <span>{student.father_name}</span>
                  </div>
                )}
                {student.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span>{student.email}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Telefone:</span>
                    <span>{student.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dados Escolares */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Dados Escolares
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <School className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Escola:</span>
                  <span>{school.school_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <School className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Rede:</span>
                  <span>{tenant.network_name}</span>
                </div>
                {currentEnrollment?.grade && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Série/Turma:</span>
                    <span>{currentEnrollment.grade}</span>
                  </div>
                )}
                {currentEnrollment?.shift && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Turno:</span>
                    <span>{currentEnrollment.shift}</span>
                  </div>
                )}
                {currentEnrollment?.academic_year && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ano Letivo:</span>
                    <span>{currentEnrollment.academic_year}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores de Risco e Sugestões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {risks && <RiskIndicators risks={risks} />}
        {suggestions && <SuggestionsPanel suggestions={suggestions} studentId={studentId} />}
      </div>
    </div>
  );
}

