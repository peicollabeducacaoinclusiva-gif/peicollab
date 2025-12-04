import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSchools } from '../hooks/useStudents';
import { useUserProfile } from '../hooks/useUserProfile';
import { useClasses } from '../hooks/useClasses';
import type { Student } from '../services/studentsService';
import { toast } from 'sonner';

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSave: (studentData: Partial<Student>) => Promise<void>;
}





const NEE_TYPES = [
  { value: "TDAH", label: "TDAH (Transtorno de Déficit de Atenção e Hiperatividade)" },
  { value: "TOD", label: "TOD (Transtorno Opositor Desafiador)" },
  { value: "TEA", label: "TEA (Transtorno do Espectro Autista)" },
  { value: "Dislexia", label: "Dislexia" },
  { value: "Discalculia", label: "Discalculia" },
  { value: "Disgrafia", label: "Disgrafia" },
  { value: "Transtorno de Aprendizagem", label: "Transtorno de Aprendizagem" },
  { value: "Altas Habilidades", label: "Altas Habilidades/Superdotação" },
];

export function StudentFormDialog({ open, onOpenChange, student, onSave }: StudentFormDialogProps) {
  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');
  const { data: classesData } = useClasses({
    tenantId: userProfile?.tenant_id || '',
    page: 1,
    pageSize: 1000,
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Dados pessoais
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthCertificate, setBirthCertificate] = useState('');
  const [naturalidade, setNaturalidade] = useState('');
  const [nationality, setNationality] = useState('Brasileira');

  // Dados de endereço
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Dados familiares
  const [motherName, setMotherName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianCpf, setGuardianCpf] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Dados escolares
  const [schoolId, setSchoolId] = useState('');
  const [classId, setClassId] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');

  // Dados de saúde
  const [healthInfo, setHealthInfo] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');

  // Necessidades especiais
  const [hasSpecialNeeds, setHasSpecialNeeds] = useState(false);
  const [specialNeedsTypes, setSpecialNeedsTypes] = useState<string[]>([]);
  const [familyGuidanceNotes, setFamilyGuidanceNotes] = useState('');

  // Contatos
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (student) {
      setName(student.name || '');
      setDateOfBirth(student.date_of_birth || '');
      setMotherName(student.mother_name || '');
      setFatherName(student.father_name || '');
      setEmail(student.email || '');
      setPhone(student.phone || '');
      setSchoolId(student.school_id || '');
      setClassId(student.class_id || '');
      setRegistrationNumber(student.registration_number || student.student_id || '');
      setStudentId(student.student_id || '');
      setHasSpecialNeeds(student.necessidades_especiais || false);
      setSpecialNeedsTypes(student.tipo_necessidade || []);
      setFamilyGuidanceNotes((student as any).family_guidance_notes || '');
    } else {
      // Reset form
      setName('');
      setDateOfBirth('');
      setCpf('');
      setRg('');
      setBirthCertificate('');
      setNaturalidade('');
      setNationality('Brasileira');
      setAddress('');
      setCity('');
      setState('');
      setZipCode('');
      setMotherName('');
      setFatherName('');
      setGuardianName('');
      setGuardianCpf('');
      setGuardianPhone('');
      setGuardianEmail('');
      setEmergencyContact('');
      setEmergencyPhone('');
      setSchoolId(userProfile?.school_id || '');
      setClassId('');
      setRegistrationNumber('');
      setStudentId('');
      setEnrollmentDate('');
      setHealthInfo('');
      setAllergies('');
      setMedications('');
      setHasSpecialNeeds(false);
      setSpecialNeedsTypes([]);
      setFamilyGuidanceNotes('');
      setEmail('');
      setPhone('');
    }
  }, [student, userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Nome do aluno é obrigatório');
      return;
    }

    if (!schoolId) {
      toast.error('Selecione uma escola');
      return;
    }

    if (!userProfile?.tenant_id) {
      toast.error('Erro: tenant_id não encontrado');
      return;
    }

    try {
      setLoading(true);

      const studentData: Partial<Student> = {
        name: name.trim(),
        date_of_birth: dateOfBirth || undefined,
        school_id: schoolId,
        tenant_id: userProfile.tenant_id,
        class_id: classId || undefined,
        registration_number: registrationNumber || undefined,
        student_id: studentId || registrationNumber || undefined,
        mother_name: motherName || undefined,
        father_name: fatherName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        necessidades_especiais: hasSpecialNeeds,
        tipo_necessidade: hasSpecialNeeds ? specialNeedsTypes : [],
        is_active: true,
        // Campos adicionais que podem estar na tabela
        ...(cpf && { cpf }),
        ...(rg && { rg }),
        ...(birthCertificate && { birth_certificate: birthCertificate }),
        ...(naturalidade && { naturalidade }),
        ...(address && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(zipCode && { zip_code: zipCode }),
        ...(guardianName && { guardian_name: guardianName }),
        ...(guardianCpf && { guardian_cpf: guardianCpf }),
        ...(guardianPhone && { guardian_phone: guardianPhone }),
        ...(guardianEmail && { guardian_email: guardianEmail }),
        ...(emergencyContact && { emergency_contact: emergencyContact }),
        ...(emergencyPhone && { emergency_phone: emergencyPhone }),
        ...(enrollmentDate && { enrollment_date: enrollmentDate }),
        ...(healthInfo && { health_info: healthInfo }),
        ...(allergies && { allergies }),
        ...(medications && { medications }),
        ...(familyGuidanceNotes && { family_guidance_notes: familyGuidanceNotes }),
      };

      await onSave(studentData);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar aluno');
    } finally {
      setLoading(false);
    }
  };

  const handleNeeTypeToggle = (neeType: string) => {
    setSpecialNeedsTypes(prev =>
      prev.includes(neeType)
        ? prev.filter(t => t !== neeType)
        : [...prev, neeType]
    );
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

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="family">Dados Familiares</TabsTrigger>
              <TabsTrigger value="school">Dados Escolares</TabsTrigger>
              <TabsTrigger value="health">Saúde</TabsTrigger>
              <TabsTrigger value="special">NEE</TabsTrigger>
            </TabsList>

            {/* Dados Pessoais */}
            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Nome completo do aluno"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rg">RG</Label>
                      <Input
                        id="rg"
                        value={rg}
                        onChange={(e) => setRg(e.target.value)}
                        placeholder="Número do RG"
                      />
                    </div>
                    <div>
                      <Label htmlFor="birthCertificate">Certidão de Nascimento</Label>
                      <Input
                        id="birthCertificate"
                        value={birthCertificate}
                        onChange={(e) => setBirthCertificate(e.target.value)}
                        placeholder="Número da certidão"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="naturalidade">Naturalidade</Label>
                      <Input
                        id="naturalidade"
                        value={naturalidade}
                        onChange={(e) => setNaturalidade(e.target.value)}
                        placeholder="Cidade de nascimento"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationality">Nacionalidade</Label>
                      <Input
                        id="nationality"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        placeholder="Brasileira"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua, número, complemento"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Cidade"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contatos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dados Familiares */}
            <TabsContent value="family" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Responsáveis Legais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="motherName">Nome da Mãe</Label>
                      <Input
                        id="motherName"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        placeholder="Nome completo da mãe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fatherName">Nome do Pai</Label>
                      <Input
                        id="fatherName"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="Nome completo do pai"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="guardianName">Responsável Legal (se diferente)</Label>
                    <Input
                      id="guardianName"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="Nome do responsável legal"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="guardianCpf">CPF do Responsável</Label>
                      <Input
                        id="guardianCpf"
                        value={guardianCpf}
                        onChange={(e) => setGuardianCpf(e.target.value)}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianPhone">Telefone do Responsável</Label>
                      <Input
                        id="guardianPhone"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianEmail">E-mail do Responsável</Label>
                      <Input
                        id="guardianEmail"
                        type="email"
                        value={guardianEmail}
                        onChange={(e) => setGuardianEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contato de Emergência</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContact">Nome do Contato</Label>
                      <Input
                        id="emergencyContact"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="Nome do contato de emergência"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                      <Input
                        id="emergencyPhone"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Orientações Familiares</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="familyGuidanceNotes">Observações sobre a Família</Label>
                  <Textarea
                    id="familyGuidanceNotes"
                    value={familyGuidanceNotes}
                    onChange={(e) => setFamilyGuidanceNotes(e.target.value)}
                    placeholder="Informações relevantes sobre a família e orientações..."
                    rows={4}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dados Escolares */}
            <TabsContent value="school" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Escolares</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="schoolId">Escola *</Label>
                      <Select value={schoolId} onValueChange={setSchoolId} required>
                        <SelectTrigger id="schoolId">
                          <SelectValue placeholder="Selecione a escola" />
                        </SelectTrigger>
                        <SelectContent>
                          {schoolsData.map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.school_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="classId">Turma</Label>
                      <Select value={classId} onValueChange={setClassId}>
                        <SelectTrigger id="classId">
                          <SelectValue placeholder="Selecione a turma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sem turma</SelectItem>
                          {filteredClasses.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.class_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="registrationNumber">Número de Matrícula</Label>
                      <Input
                        id="registrationNumber"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        placeholder="Número de matrícula"
                      />
                    </div>
                    <div>
                      <Label htmlFor="studentId">ID do Aluno</Label>
                      <Input
                        id="studentId"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="ID único do aluno"
                      />
                    </div>
                    <div>
                      <Label htmlFor="enrollmentDate">Data de Matrícula</Label>
                      <Input
                        id="enrollmentDate"
                        type="date"
                        value={enrollmentDate}
                        onChange={(e) => setEnrollmentDate(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Saúde */}
            <TabsContent value="health" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações de Saúde</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="healthInfo">Informações Gerais de Saúde</Label>
                    <Textarea
                      id="healthInfo"
                      value={healthInfo}
                      onChange={(e) => setHealthInfo(e.target.value)}
                      placeholder="Informações gerais sobre a saúde do aluno..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="allergies">Alergias</Label>
                    <Textarea
                      id="allergies"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="Liste as alergias conhecidas..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="medications">Medicamentos</Label>
                    <Textarea
                      id="medications"
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                      placeholder="Medicamentos de uso contínuo ou emergencial..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Necessidades Especiais */}
            <TabsContent value="special" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Necessidades Educacionais Especiais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasSpecialNeeds"
                      checked={hasSpecialNeeds}
                      onCheckedChange={(checked) => setHasSpecialNeeds(checked === true)}
                    />
                    <Label htmlFor="hasSpecialNeeds" className="font-medium">
                      Aluno possui necessidades educacionais especiais
                    </Label>
                  </div>

                  {hasSpecialNeeds && (
                    <div>
                      <Label>Tipo(s) de Necessidade</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {NEE_TYPES.map((nee) => (
                          <div key={nee.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`nee-${nee.value}`}
                              checked={specialNeedsTypes.includes(nee.value)}
                              onCheckedChange={() => handleNeeTypeToggle(nee.value)}
                            />
                            <Label
                              htmlFor={`nee-${nee.value}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {nee.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : student ? 'Atualizar' : 'Criar Aluno'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

