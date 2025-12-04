import { supabase } from '@pei/database';
import { EDUCATION_LEVEL_LABELS } from '../lib/constants';
import { auditMiddleware } from '@pei/database/audit';

export interface Student {
  id: string;
  name: string;
  date_of_birth?: string;
  student_id?: string;
  registration_number?: string;
  class_name?: string;
  is_active: boolean;
  school_id: string;
  tenant_id: string;
  class_id?: string;
  
  // Dados pessoais
  cpf?: string;
  rg?: string;
  birth_certificate?: string;
  naturalidade?: string;
  nationality?: string;
  
  // Endereço
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  
  // Contatos
  email?: string;
  phone?: string;
  
  // Dados familiares
  mother_name?: string;
  father_name?: string;
  guardian_name?: string;
  guardian_cpf?: string;
  guardian_phone?: string;
  guardian_email?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  
  // Dados escolares
  enrollment_date?: string;
  
  // Dados de saúde
  health_info?: string;
  allergies?: string;
  medications?: string;
  family_guidance_notes?: string;
  
  // Necessidades especiais
  necessidades_especiais?: boolean;
  tipo_necessidade?: string[];
  grade?: string | null;
  shift?: string | null;
  educationLevel?: string | null;
  
  // Relacionamentos
  school?: {
    school_name: string;
    tenant_id: string;
  };
}

export interface StudentFilters {
  tenantId: string;
  schoolId?: string;
  search?: string;
  filterSchool?: string;
  filterEducationLevel?: string;
  filterGrade?: string;
  filterShift?: string;
  filterWithDisability?: string;
  filterNEE?: string;
  sortKey?: 'name' | 'class' | 'school';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const studentsService = {
  async getStudents(filters: StudentFilters) {
    const {
      tenantId,
      schoolId,
      search,
      filterSchool,
      filterWithDisability,
      filterNEE,
      filterGrade,
      filterShift,
      filterEducationLevel,
      sortKey = 'name',
      sortDir = 'asc',
      page = 1,
      pageSize = 30,
    } = filters;

    // Construção dinâmica do select para permitir Inner Joins quando houver filtros
    // Incluindo todos os campos opcionais que podem estar no banco
    let selectQuery = `
      id,
      name,
      date_of_birth,
      student_id,
      class_name,
      is_active,
      school_id,
      tenant_id,
      class_id,
      mother_name,
      father_name,
      email,
      phone,
      necessidades_especiais,
      tipo_necessidade,
      cpf,
      rg,
      birth_certificate,
      naturalidade,
      nationality,
      address,
      city,
      state,
      zip_code,
      guardian_name,
      guardian_cpf,
      guardian_phone,
      guardian_email,
      emergency_contact,
      emergency_phone,
      enrollment_date,
      health_info,
      allergies,
      medications,
      family_guidance_notes,
      schools!students_school_id_fkey(school_name)
    `;

    // Se houver filtros de matrícula, usamos !inner para forçar o join e permitir o filtro
    if (filterGrade !== 'all' || filterShift !== 'all') {
      selectQuery += `, student_enrollments!inner(grade, shift, academic_year)`;
    } else {
      selectQuery += `, student_enrollments(grade, shift, academic_year)`;
    }

    // Se houver filtro de nível educacional (que geralmente vem da turma/classe), precisamos fazer join com classes
    // Assumindo que education_level está em classes
    if (filterEducationLevel !== 'all') {
      selectQuery += `, classes!inner(education_level)`;
    }

    let query = supabase
      .from('students')
      .select(selectQuery, { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }

    if (filterSchool && filterSchool !== 'all') {
      query = query.eq('school_id', filterSchool);
    }

    if (filterWithDisability === 'yes') {
      query = query.eq('necessidades_especiais', true);
    } else if (filterWithDisability === 'no') {
      query = query.eq('necessidades_especiais', false);
    }

    if (filterNEE && filterNEE !== 'all') {
      query = query.contains('tipo_necessidade', [filterNEE]);
    }

    if (filterGrade && filterGrade !== 'all') {
      query = query.eq('student_enrollments.grade', filterGrade);
    }

    if (filterShift && filterShift !== 'all') {
      query = query.eq('student_enrollments.shift', filterShift);
    }

    // Nota: O filtro de educationLevel depende da estrutura exata do banco. 
    // Se education_level estiver em classes:
    if (filterEducationLevel && filterEducationLevel !== 'all') {
      // Mapeamento reverso: chave legível do frontend -> valores do banco
      // O frontend passa chaves como "EDUCAÇÃO INFANTIL", precisamos converter para valores do banco
      const levelMap: Record<string, string[]> = {
        "EDUCAÇÃO INFANTIL": ["educacao_infantil"],
        "ENSINO FUNDAMENTAL": ["ensino_fundamental_1", "ensino_fundamental_2"],
        "ENSINO MÉDIO": ["ensino_medio"],
        "EJA": ["eja"],
      };

      const dbValues = levelMap[filterEducationLevel];
      if (dbValues) {
        query = query.in('classes.education_level', dbValues);
      }
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Ordenação
    if (sortKey === 'school') {
      query = query.order('school_id', { ascending: sortDir === 'asc' });
    } else if (sortKey === 'class') {
      query = query.order('class_name', { ascending: sortDir === 'asc' });
    } else {
      query = query.order('name', { ascending: sortDir === 'asc' });
    }

    // Paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // Buscar dados de classes se necessário
    const classIds = [...new Set((data || []).filter((r: any) => r.class_id).map((r: any) => r.class_id))];
    let classesData: Record<string, any> = {};

    if (classIds.length > 0) {
      const { data: classes } = await supabase
        .from('classes')
        .select('id, education_level, grade, shift')
        .in('id', classIds);

      if (classes) {
        classesData = classes.reduce((acc: Record<string, any>, cls: any) => {
          acc[cls.id] = cls;
          return acc;
        }, {});
      }
    }

    // Mapear dados
    const mapped = (data || []).map((row: any) => {
      const enrollment = Array.isArray(row.student_enrollments) && row.student_enrollments.length > 0
        ? row.student_enrollments[0]
        : null;
      const classData = row.class_id ? classesData[row.class_id] : null;

      const grade = enrollment?.grade || classData?.grade || null;
      const shift = enrollment?.shift || classData?.shift || null;
      const educationLevel = classData?.education_level || null;

      return {
        id: row.id,
        name: row.name,
        date_of_birth: row.date_of_birth,
        registration_number: row.student_id,
        student_id: row.student_id,
        guardian_name: row.mother_name || row.father_name || null,
        guardian_phone: row.phone || null,
        is_active: row.is_active ?? true,
        class_name: row.class_name || null,
        necessidades_especiais: row.necessidades_especiais || false,
        tipo_necessidade: row.tipo_necessidade || [],
        grade,
        shift,
        educationLevel,
        school: {
          school_name: row.schools?.school_name || null,
          tenant_id: tenantId,
        },
        school_id: row.school_id,
        tenant_id: row.tenant_id,
        class_id: row.class_id,
        mother_name: row.mother_name,
        father_name: row.father_name,
        email: row.email,
        phone: row.phone,
        // Campos opcionais (podem vir do banco se existirem)
        cpf: row.cpf,
        rg: row.rg,
        birth_certificate: row.birth_certificate,
        naturalidade: row.naturalidade,
        nationality: row.nationality,
        address: row.address,
        city: row.city,
        state: row.state,
        zip_code: row.zip_code,
        guardian_cpf: row.guardian_cpf,
        guardian_email: row.guardian_email,
        emergency_contact: row.emergency_contact,
        emergency_phone: row.emergency_phone,
        enrollment_date: row.enrollment_date,
        health_info: row.health_info,
        allergies: row.allergies,
        medications: row.medications,
        family_guidance_notes: row.family_guidance_notes,
      } as Student;
    });

    return {
      data: mapped,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  async getStudentById(studentId: string) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        schools!students_school_id_fkey(school_name),
        student_enrollments!student_enrollments_student_id_fkey(grade, shift, academic_year)
      `)
      .eq('id', studentId)
      .single();

    if (error) throw error;
    return data;
  },

  async createStudent(student: Partial<Student>) {
    const studentData: any = {
      name: student.name,
      date_of_birth: student.date_of_birth,
      student_id: student.student_id || student.registration_number,
      class_name: student.class_name,
      school_id: student.school_id,
      tenant_id: student.tenant_id,
      class_id: student.class_id,
      mother_name: student.mother_name,
      father_name: student.father_name,
      email: student.email,
      phone: student.phone,
      necessidades_especiais: student.necessidades_especiais || false,
      tipo_necessidade: student.tipo_necessidade || [],
      is_active: student.is_active ?? true,
    };

    // Adicionar campos opcionais se existirem (agora tipados corretamente)
    if (student.cpf) studentData.cpf = student.cpf;
    if (student.rg) studentData.rg = student.rg;
    if (student.birth_certificate) studentData.birth_certificate = student.birth_certificate;
    if (student.naturalidade) studentData.naturalidade = student.naturalidade;
    if (student.nationality) studentData.nationality = student.nationality;
    if (student.address) studentData.address = student.address;
    if (student.city) studentData.city = student.city;
    if (student.state) studentData.state = student.state;
    if (student.zip_code) studentData.zip_code = student.zip_code;
    if (student.guardian_name) studentData.guardian_name = student.guardian_name;
    if (student.guardian_cpf) studentData.guardian_cpf = student.guardian_cpf;
    if (student.guardian_phone) studentData.guardian_phone = student.guardian_phone;
    if (student.guardian_email) studentData.guardian_email = student.guardian_email;
    if (student.emergency_contact) studentData.emergency_contact = student.emergency_contact;
    if (student.emergency_phone) studentData.emergency_phone = student.emergency_phone;
    if (student.enrollment_date) studentData.enrollment_date = student.enrollment_date;
    if (student.health_info) studentData.health_info = student.health_info;
    if (student.allergies) studentData.allergies = student.allergies;
    if (student.medications) studentData.medications = student.medications;
    if (student.family_guidance_notes) studentData.family_guidance_notes = student.family_guidance_notes;

    const { data, error } = await supabase
      .from('students')
      .insert(studentData)
      .select()
      .single();

    if (error) throw error;

    // Gravar auditoria após criação bem-sucedida
    if (data && student.tenant_id) {
      await auditMiddleware.logCreate(
        student.tenant_id,
        'student',
        data.id,
        {
          source: 'create_student',
          student_name: data.name,
          school_id: data.school_id,
        }
      ).catch(err => console.error('Erro ao gravar auditoria de criação de aluno:', err));
    }

    return data;
  },

  async updateStudent(studentId: string, updates: Partial<Student>) {
    // Buscar dados antigos para auditoria
    const { data: oldData } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    const { data, error } = await supabase
      .from('students')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;

    // Gravar auditoria após atualização bem-sucedida
    if (data && oldData && data.tenant_id) {
      await auditMiddleware.logUpdate(
        data.tenant_id,
        'student',
        studentId,
        oldData as Record<string, unknown>,
        data as Record<string, unknown>,
        `Aluno ${data.name} atualizado`
      ).catch(err => console.error('Erro ao gravar auditoria de atualização de aluno:', err));
    }

    return data;
  },

  async deleteStudent(studentId: string) {
    // Buscar dados do aluno antes de desativar para auditoria
    const { data: studentData } = await supabase
      .from('students')
      .select('tenant_id, name')
      .eq('id', studentId)
      .single();

    const { error } = await supabase
      .from('students')
      .update({ is_active: false })
      .eq('id', studentId);

    if (error) throw error;

    // Gravar auditoria após desativação bem-sucedida
    if (studentData?.tenant_id) {
      await auditMiddleware.logDelete(
        studentData.tenant_id,
        'student',
        studentId,
        {
          source: 'delete_student',
          student_name: studentData.name,
          action: 'soft_delete',
        }
      ).catch(err => console.error('Erro ao gravar auditoria de exclusão de aluno:', err));
    }
  },

  async getSchools(tenantId: string) {
    const { data, error } = await supabase
      .from('schools')
      .select('id, school_name')
      .eq('tenant_id', tenantId)
      .order('school_name');

    if (error) throw error;
    return data || [];
  },
};




