import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Calendar, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UnifiedStudentData } from '../../services/unifiedStudentService';

interface StudentPersonalDataProps {
  data: UnifiedStudentData;
}

export function StudentPersonalData({ data }: StudentPersonalDataProps) {
  const { student } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Pessoais</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
              <p className="text-base">{student.name}</p>
            </div>
            {student.date_of_birth && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Nascimento
                </label>
                <p className="text-base">
                  {format(new Date(student.date_of_birth), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
            {student.registration_number && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Registro Acadêmico
                </label>
                <p className="text-base">{student.registration_number}</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {student.mother_name && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome da Mãe
                </label>
                <p className="text-base">{student.mother_name}</p>
              </div>
            )}
            {student.father_name && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome do Pai
                </label>
                <p className="text-base">{student.father_name}</p>
              </div>
            )}
            {student.email && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-base">{student.email}</p>
              </div>
            )}
            {student.phone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </label>
                <p className="text-base">{student.phone}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

