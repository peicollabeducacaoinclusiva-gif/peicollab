import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Calendar, Mail, Phone, School, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UnifiedStudentData } from '../../services/unifiedStudentService';

interface UnifiedStudentCardProps {
  data: UnifiedStudentData;
}

export function UnifiedStudentCard({ data }: UnifiedStudentCardProps) {
  const { student, school, tenant, active_pei, active_aee, current_enrollment } = data;

  const initials = student.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{student.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                {student.registration_number && (
                  <Badge variant="outline">RA: {student.registration_number}</Badge>
                )}
                {active_pei && (
                  <Badge variant="default" className="bg-blue-600">
                    PEI Ativo
                  </Badge>
                )}
                {active_aee && (
                  <Badge variant="default" className="bg-green-600">
                    AEE Ativo
                  </Badge>
                )}
                {student.necessidades_especiais && (
                  <Badge variant="default" className="bg-purple-600">
                    NEE
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Data de Nascimento:</span>
              <span>
                {student.date_of_birth
                  ? format(new Date(student.date_of_birth), "dd/MM/yyyy", { locale: ptBR })
                  : 'Não informado'}
              </span>
            </div>
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
          <div className="space-y-3">
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
            {current_enrollment && (
              <>
                {current_enrollment.grade && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Série/Turma:</span>
                    <span>{current_enrollment.grade}</span>
                  </div>
                )}
                {current_enrollment.shift && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Turno:</span>
                    <span>{current_enrollment.shift}</span>
                  </div>
                )}
                {current_enrollment.academic_year && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ano Letivo:</span>
                    <span>{current_enrollment.academic_year}</span>
                  </div>
                )}
              </>
            )}
            {student.class_name && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Turma:</span>
                <span>{student.class_name}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

