import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Tabs, TabsContent, TabsList, TabsTrigger } from '@pei/ui';
import { Form } from '@pei/ui';
import { useSchools } from '../hooks/useStudents';
import { useUserProfile } from '../hooks/useUserProfile';
import { useClasses } from '../hooks/useClasses';
import type { Student } from '../services/studentsService';
import { studentSchema, type StudentFormData } from '../lib/validationSchemas';
import { toast } from 'sonner';

// Sub-components
import { StudentPersonalData } from './student-form/StudentPersonalData';
import { StudentFamilyData } from './student-form/StudentFamilyData';
import { StudentSchoolData } from './student-form/StudentSchoolData';
import { StudentHealthData } from './student-form/StudentHealthData';
import { StudentSpecialNeedsData } from './student-form/StudentSpecialNeedsData';

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSave: (studentData: Partial<Student>) => Promise<void>;
}

export function StudentFormDialog({ open, onOpenChange, student, onSave }: StudentFormDialogProps) {
  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');
  const { data: classesData } = useClasses({
    tenantId: userProfile?.tenant_id || '',
    page: 1,
    pageSize: 1000,
  });

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      date_of_birth: '',
      cpf: '',
      rg: '',
      birth_certificate: '',
      naturalidade: '',
      nationality: 'Brasileira',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      email: '',
      phone: '',
      mother_name: '',
      father_name: '',
      guardian_name: '',
      guardian_cpf: '',
      guardian_phone: '',
      guardian_email: '',
      emergency_contact: '',
      emergency_phone: '',
      school_id: userProfile?.school_id || '',
      class_id: '',
      registration_number: '',
      student_id: '',
      enrollment_date: '',
      health_info: '',
      allergies: '',
      medications: '',
      has_special_needs: false,
      special_needs_types: [],
      family_guidance_notes: '',
    },
  });

  const schoolId = form.watch('school_id');

  // Reset form when student changes
  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name || '',
        date_of_birth: student.date_of_birth || '',
        cpf: student.cpf || '',
        rg: student.rg || '',
        birth_certificate: student.birth_certificate || '',
        naturalidade: student.naturalidade || '',
        nationality: student.nationality || 'Brasileira',
        address: student.address || '',
        city: student.city || '',
        state: student.state || '',
        zip_code: student.zip_code || '',
        email: student.email || '',
        phone: student.phone || '',
        mother_name: student.mother_name || '',
        father_name: student.father_name || '',
        guardian_name: student.guardian_name || '',
        guardian_cpf: student.guardian_cpf || '',
        guardian_phone: student.guardian_phone || '',
        guardian_email: student.guardian_email || '',
        emergency_contact: student.emergency_contact || '',
        emergency_phone: student.emergency_phone || '',
        school_id: student.school_id || '',
        class_id: student.class_id || '',
        registration_number: student.registration_number || student.student_id || '',
        student_id: student.student_id || '',
        enrollment_date: student.enrollment_date || '',
        health_info: student.health_info || '',
        allergies: student.allergies || '',
        medications: student.medications || '',
        has_special_needs: student.necessidades_especiais || false,
        special_needs_types: student.tipo_necessidade || [],
        family_guidance_notes: student.family_guidance_notes || '',
      });
    } else {
      form.reset({
        name: '',
        date_of_birth: '',
        cpf: '',
        rg: '',
        birth_certificate: '',
        naturalidade: '',
        nationality: 'Brasileira',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        email: '',
        phone: '',
        mother_name: '',
        father_name: '',
        guardian_name: '',
        guardian_cpf: '',
        guardian_phone: '',
        guardian_email: '',
        emergency_contact: '',
        emergency_phone: '',
        school_id: userProfile?.school_id || '',
        class_id: '',
        registration_number: '',
        student_id: '',
        enrollment_date: '',
        health_info: '',
        allergies: '',
        medications: '',
        has_special_needs: false,
        special_needs_types: [],
        family_guidance_notes: '',
      });
    }
  }, [student, userProfile, form]);

  const onSubmit = async (data: StudentFormData) => {
    if (!userProfile?.tenant_id) {
      toast.error('Erro: tenant_id não encontrado');
      return;
    }

    try {
      const studentData: Partial<Student> = {
        name: data.name.trim(),
        date_of_birth: data.date_of_birth || undefined,
        school_id: data.school_id || undefined,
        tenant_id: userProfile.tenant_id,
        class_id: data.class_id || undefined,
        registration_number: data.registration_number || undefined,
        student_id: data.student_id || data.registration_number || undefined,
        mother_name: data.mother_name || undefined,
        father_name: data.father_name || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        necessidades_especiais: data.has_special_needs,
        tipo_necessidade: data.has_special_needs ? data.special_needs_types : [],
        is_active: true,
        ...(data.cpf && { cpf: data.cpf }),
        ...(data.rg && { rg: data.rg }),
        ...(data.birth_certificate && { birth_certificate: data.birth_certificate }),
        ...(data.naturalidade && { naturalidade: data.naturalidade }),
        ...(data.address && { address: data.address }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.zip_code && { zip_code: data.zip_code }),
        ...(data.guardian_name && { guardian_name: data.guardian_name }),
        ...(data.guardian_cpf && { guardian_cpf: data.guardian_cpf }),
        ...(data.guardian_phone && { guardian_phone: data.guardian_phone }),
        ...(data.guardian_email && { guardian_email: data.guardian_email }),
        ...(data.emergency_contact && { emergency_contact: data.emergency_contact }),
        ...(data.emergency_phone && { emergency_phone: data.emergency_phone }),
        ...(data.enrollment_date && { enrollment_date: data.enrollment_date }),
        ...(data.health_info && { health_info: data.health_info }),
        ...(data.allergies && { allergies: data.allergies }),
        ...(data.medications && { medications: data.medications }),
        ...(data.family_guidance_notes && { family_guidance_notes: data.family_guidance_notes }),
      };

      await onSave(studentData);
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar aluno');
    }
  };

  const filteredClasses = classesData?.data?.filter(
    cls => !schoolId || cls.school_id === schoolId
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? 'Editar Aluno' : 'Novo Aluno'}</DialogTitle>
          <DialogDescription>
            {student ? 'Atualize as informações do aluno' : 'Preencha os dados do novo aluno'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="family">Dados Familiares</TabsTrigger>
                <TabsTrigger value="school">Dados Escolares</TabsTrigger>
                <TabsTrigger value="health">Saúde</TabsTrigger>
                <TabsTrigger value="special">NEE</TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <StudentPersonalData />
              </TabsContent>

              <TabsContent value="family">
                <StudentFamilyData />
              </TabsContent>

              <TabsContent value="school">
                <StudentSchoolData
                  schoolsData={schoolsData}
                  filteredClasses={filteredClasses}
                />
              </TabsContent>

              <TabsContent value="health">
                <StudentHealthData />
              </TabsContent>

              <TabsContent value="special">
                <StudentSpecialNeedsData />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Salvar
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
