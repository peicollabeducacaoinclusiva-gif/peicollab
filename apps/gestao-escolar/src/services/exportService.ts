import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { supabase } from '@pei/database';
import { formatTimestampForFilename, downloadTextFile, downloadBlob } from '@pei/ui';

export interface ExportConfig {
  format: 'csv' | 'excel' | 'json' | 'educacenso';
  fields: string[];
  filters?: Record<string, any>;
  fileName?: string;
}

export interface ExportResult {
  success: boolean;
  batchId?: string;
  fileUrl?: string;
  recordCount: number;
  error?: string;
}

/**
 * Exportar dados para CSV
 */
export function exportToCSV(data: Record<string, any>[], fields: string[], fileName: string): void {
  const csv = Papa.unparse(data, {
    columns: fields,
    header: true
  });
  
  // Adicionar BOM para compatibilidade com Excel
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csv;
  
  // Adicionar timestamp ao nome do arquivo
  const timestamp = formatTimestampForFilename();
  const baseName = fileName.replace(/\.csv$/i, '');
  const finalFileName = `${baseName}-${timestamp}.csv`;
  
  downloadTextFile(finalFileName, csvWithBOM, 'text/csv;charset=utf-8;');
}

/**
 * Exportar dados para Excel
 */
export async function exportToExcel(data: Record<string, any>[], fields: string[], fileName: string): Promise<void> {
  try {
    // Filtrar apenas os campos selecionados
    const filteredData = data.map(row => {
      const filtered: Record<string, any> = {};
      fields.forEach(field => {
        filtered[field] = row[field];
      });
      return filtered;
    });
    
    // Criar workbook e worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dados');
    
    // Adicionar cabeçalhos
    worksheet.addRow(fields);
    
    // Estilizar cabeçalhos
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCCCCC' }
    };
    
    // Adicionar dados
    filteredData.forEach(row => {
      const values = fields.map(field => row[field] ?? '');
      worksheet.addRow(values);
    });
    
    // Ajustar largura das colunas
    worksheet.columns.forEach((column, index) => {
      column.width = 15;
    });
    
    // Adicionar timestamp ao nome do arquivo
    const timestamp = formatTimestampForFilename();
    const baseName = fileName.replace(/\.xlsx?$/i, '');
    const finalFileName = `${baseName}-${timestamp}.xlsx`;
    
    // Gerar buffer e fazer download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    downloadBlob(finalFileName, blob);
  } catch (error: any) {
    console.error('Erro ao exportar para Excel:', error);
    throw new Error(`Erro ao exportar para Excel: ${error.message}`);
  }
}

/**
 * Exportar dados para JSON
 */
export function exportToJSON(data: Record<string, any>[], fields: string[], fileName: string): void {
  const filteredData = data.map(row => {
    const filtered: Record<string, any> = {};
    fields.forEach(field => {
      filtered[field] = row[field];
    });
    return filtered;
  });
  
  const json = JSON.stringify(filteredData, null, 2);
  
  // Adicionar timestamp ao nome do arquivo
  const timestamp = formatTimestampForFilename();
  const baseName = fileName.replace(/\.json$/i, '');
  const finalFileName = `${baseName}-${timestamp}.json`;
  
  downloadTextFile(finalFileName, json, 'application/json;charset=utf-8;');
}

/**
 * Exportar para formato Educacenso (INEP)
 * Formato: delimitado por pipe (|), UTF-8 sem BOM
 * Layout baseado em: docs/educacenso/recomendacoes_completas.md
 */
export async function exportToEducacenso(
  schoolId: string,
  academicYear: string,
  fileName: string
): Promise<void> {
  // Validar dados antes de exportar
  const { data: validationData, error: validationError } = await supabase
    .rpc('validate_inep_export_data', {
      _school_id: schoolId,
      _academic_year: parseInt(academicYear)
    });
  
  if (validationError) {
    console.warn('Aviso na validação:', validationError);
  }
  
  if (validationData && validationData.length > 0) {
    const validation = validationData[0];
    if (validation.registros_invalidos > 0) {
      console.warn(`Aviso: ${validation.registros_invalidos} registros com problemas encontrados`);
      // Continuar mesmo com avisos, mas logar os problemas
      if (validation.problemas) {
        console.warn('Problemas encontrados:', validation.problemas);
      }
    }
  }
  
  // Buscar dados da escola
  const { data: school } = await supabase
    .from('schools')
    .select('*, tenant:tenants(network_name, network_address)')
    .eq('id', schoolId)
    .single();
  
  if (!school) {
    throw new Error('Escola não encontrada');
  }
  
  // Buscar turmas
  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_active', true);
  
  // Filtrar turmas do ano letivo (se o campo existir)
  const filteredClasses = classes?.filter(cls => 
    !cls.academic_year || cls.academic_year === academicYear || cls.academic_year.toString() === academicYear
  ) || [];
  
  // Buscar alunos com matrículas
  const { data: enrollments } = await supabase
    .from('student_enrollments')
    .select(`
      *,
      student:students!student_enrollments_student_id_fkey(*)
    `)
    .eq('school_id', schoolId)
    .eq('academic_year', parseInt(academicYear));
  
  // Filtrar apenas matrículas ativas
  const activeEnrollments = enrollments?.filter(e => 
    e.status === 'active' || e.status === 'Matriculado' || !e.status
  ) || [];
  
  // Buscar gestores (diretores)
  const { data: managers } = await supabase
    .from('professionals')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .eq('professional_role', 'diretor');
  
  // Buscar profissionais (professores e outros, excluindo diretores)
  const { data: professionals } = await supabase
    .from('professionals')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .neq('professional_role', 'diretor');
  
  // Gerar arquivo no formato Educacenso
  const lines: string[] = [];
  
  // Registro 00 - Escola (obrigatório, 1 por arquivo)
  lines.push(generateEducacensoSchoolRecord(school, academicYear));
  
  // Registro 10 - Infraestrutura (opcional)
  // TODO: Adicionar quando houver tabela de infraestrutura
  // lines.push(generateEducacensoInfraRecord(school));
  
  // Registro 20 - Turmas (0..n)
  filteredClasses.forEach(cls => {
    lines.push(generateEducacensoClassRecord(cls, school));
  });
  
  // Registro 30 - Pessoas (base para alunos/profissionais, 0..n)
  // Primeiro, coletar todas as pessoas únicas
  const peopleMap = new Map<string, any>();
  
  // Gerar ID local da escola (usar código INEP ou ID simplificado)
  const schoolLocalId = school.codigo_inep?.replace(/\D/g, '').substring(0, 4) || 
                       school.id.replace(/-/g, '').substring(0, 4).toUpperCase() || 
                       'ESC1';
  
  // Adicionar alunos
  let studentCounter = 1;
  activeEnrollments.forEach(enrollment => {
    const student = enrollment.student;
    if (student && !peopleMap.has(student.id)) {
      peopleMap.set(student.id, {
        local_id: `${schoolLocalId}_A${String(studentCounter).padStart(3, '0')}`,
        type: 'student',
        data: student
      });
      studentCounter++;
    }
  });
  
  // Adicionar gestores
  let managerCounter = 1;
  managers?.forEach(manager => {
    if (!peopleMap.has(manager.id)) {
      peopleMap.set(manager.id, {
        local_id: `${schoolLocalId}_G${String(managerCounter).padStart(3, '0')}`,
        type: 'manager',
        data: manager
      });
      managerCounter++;
    }
  });
  
  // Adicionar profissionais
  let profCounter = 1;
  professionals?.forEach(prof => {
    if (!peopleMap.has(prof.id)) {
      peopleMap.set(prof.id, {
        local_id: `${schoolLocalId}_P${String(profCounter).padStart(3, '0')}`,
        type: 'professional',
        data: prof
      });
      profCounter++;
    }
  });
  
  // Gerar registros 30 (pessoas)
  const peopleLocalIds = new Map<string, string>();
  peopleMap.forEach((personInfo, personId) => {
    lines.push(generateEducacensoPersonRecord(personInfo.data, personInfo.local_id));
    peopleLocalIds.set(personId, personInfo.local_id);
  });
  
  // Registro 40 - Gestores (0..n)
  managers?.forEach(manager => {
    const localId = peopleLocalIds.get(manager.id);
    if (localId) {
      lines.push(generateEducacensoManagerRecord(manager, localId));
    }
  });
  
  // Registro 50 - Profissionais/Staff (0..n)
  professionals?.forEach(prof => {
    const localId = peopleLocalIds.get(prof.id);
    if (localId) {
      lines.push(generateEducacensoStaffRecord(prof, localId));
    }
  });
  
  // Registro 60 - Matrículas/Alunos (0..n)
  const classLocalIds = new Map<string, string>();
  filteredClasses.forEach((cls, index) => {
    classLocalIds.set(cls.id, `${schoolLocalId}_T${index + 1}`);
  });
  
  activeEnrollments.forEach(enrollment => {
    const student = enrollment.student;
    const studentLocalId = peopleLocalIds.get(student?.id);
    const classLocalId = classLocalIds.get(enrollment.class_id);
    
    if (studentLocalId && classLocalId) {
      lines.push(generateEducacensoEnrollmentRecord(enrollment, studentLocalId, classLocalId));
    }
  });
  
  // Registro 99 - Trailer (obrigatório, 1 por arquivo)
  // Calcular hash SHA256 (usando Web Crypto API no browser)
  const content = lines.join('\n');
  let hash = '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // Fallback: hash simples se Web Crypto não estiver disponível
    hash = content.length.toString(16);
  }
  lines.push(generateEducacensoTrailer(lines.length + 1, hash));
  
  const finalContent = lines.join('\n');
  
  // Adicionar timestamp ao nome do arquivo
  const timestamp = formatTimestampForFilename();
  const baseName = fileName.replace(/\.txt$/i, '');
  const finalFileName = `${baseName}-${timestamp}.txt`;
  
  downloadTextFile(finalFileName, finalContent, 'text/plain;charset=utf-8;');
}

/**
 * Normalizar nome (remover pipes, tabs, espaços múltiplos)
 */
function normalizeName(name: string): string {
  if (!name) return '';
  return name.replace(/\|/g, ' ').replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Gerar registro 00 - Escola
 * Formato: 00|municipio_ibge|dependencia|nome_escola|inep_code|ano_base
 */
function generateEducacensoSchoolRecord(school: any, year: string): string {
  // Usar dados da view ou mapear manualmente
  const municipio_ibge = school.municipio_ibge || '0000000';
  const dependencia = school.dependencia || 
    (school.dependencia_administrativa ? school.dependencia_administrativa.toString() : 
     (school.tipo_escola === 'Municipal' ? '1' :
      school.tipo_escola === 'Estadual' ? '2' :
      school.tipo_escola === 'Federal' ? '3' :
      school.tipo_escola === 'Privada' ? '4' : '1'));
  const nome_escola = normalizeName(school.nome_escola || school.school_name || '');
  const inep_code = school.codigo_inep || school.inep_code || '';
  const ano_base = year;
  
  return `00|${municipio_ibge}|${dependencia}|${nome_escola}|${inep_code}|${ano_base}`;
}

/**
 * Gerar registro 20 - Turma
 * Formato: 20|municipio_ibge|turma_id_local|descricao|turno|serie|capacity|modalidade
 */
function generateEducacensoClassRecord(cls: any, school: any): string {
  const municipio_ibge = school.municipio_ibge || '0000000';
  const turma_id_local = cls.turma_id_local || cls.codigo_inep_turma || cls.local_id || cls.id.substring(0, 20);
  const descricao = normalizeName(cls.descricao || cls.class_name || '');
  const turno = cls.turno || cls.shift || 'M'; // M=Matutino, V=Vespertino, N=Noturno, I=Integral
  const serie = cls.serie || cls.grade || '';
  const capacity = cls.capacidade || cls.max_students || cls.current_students || 0;
  
  // Usar modalidade da view ou mapear manualmente
  const modalidade = cls.modalidade || cls.modalidade_inep || 
    (cls.education_level === 'educacao_infantil' ? 'EDUCAÇÃO_INFANTIL' :
     cls.education_level === 'ensino_fundamental_1' || cls.education_level === 'ensino_fundamental_2' ? 'ENSINO_FUNDAMENTAL' :
     cls.education_level === 'ensino_medio' ? 'ENSINO_MÉDIO' :
     cls.education_level === 'eja' ? 'EJA' : 'ENSINO_FUNDAMENTAL');
  
  return `20|${municipio_ibge}|${turma_id_local}|${descricao}|${turno}|${serie}|${capacity}|${modalidade}`;
}

/**
 * Gerar registro 30 - Pessoa (base)
 * Formato: 30|pessoa_id_local|nome|data_nascimento|sexo|cpf|inep_id
 */
function generateEducacensoPersonRecord(person: any, localId: string): string {
  const nome = normalizeName(person.name || person.full_name || '');
  const data_nascimento = formatDateEducacenso(person.date_of_birth);
  const sexo = person.sexo || person.gender || 'M';
  const cpf = (person.cpf || '').replace(/\D/g, '');
  const inep_id = person.student_id || person.codigo_inep_servidor || '';
  
  return `30|${localId}|${nome}|${data_nascimento}|${sexo}|${cpf}|${inep_id}`;
}

/**
 * Gerar registro 40 - Gestor
 * Formato: 40|pessoa_id_local|nome|cargo|data_inicio|inep_id
 */
function generateEducacensoManagerRecord(manager: any, localId: string): string {
  const nome = normalizeName(manager.full_name || '');
  const cargo = (manager.professional_role === 'diretor' || manager.professional_role?.toString() === 'diretor') ? 'Diretor' : 'Gestor';
  const data_inicio = formatDateEducacenso(manager.hire_date);
  const inep_id = manager.codigo_inep_servidor || '';
  
  return `40|${localId}|${nome}|${cargo}|${data_inicio}|${inep_id}`;
}

/**
 * Gerar registro 50 - Profissional/Staff
 * Formato: 50|pessoa_id_local|funcao_code|carga_horaria|data_admissao|inep_id
 */
function generateEducacensoStaffRecord(prof: any, localId: string): string {
  // Mapear professional_role para código de função
  const funcaoMap: Record<string, string> = {
    'professor': '01',
    'professor_aee': '02',
    'coordenador': '03',
    'psicologo': '04',
    'fonoaudiologo': '05',
    'terapeuta_ocupacional': '06',
    'assistente_social': '07',
    'profissional_apoio': '08',
    'outros': '99'
  };
  
  const funcao_code = funcaoMap[prof.professional_role] || '99';
  // Usar carga_horaria_semanal ou calcular a partir de regime_trabalho
  let carga_horaria = prof.carga_horaria_semanal;
  if (!carga_horaria && prof.regime_trabalho) {
    const regimeMap: Record<string, number> = {
      '20h': 20,
      '30h': 30,
      '40h': 40,
      'Dedicação Exclusiva': 40
    };
    carga_horaria = regimeMap[prof.regime_trabalho] || 20;
  }
  carga_horaria = carga_horaria || 20;
  const data_admissao = formatDateEducacenso(prof.hire_date);
  const inep_id = prof.codigo_inep_servidor || '';
  
  return `50|${localId}|${funcao_code}|${carga_horaria}|${data_admissao}|${inep_id}`;
}

/**
 * Gerar registro 60 - Matrícula/Aluno
 * Formato: 60|pessoa_id_local|turma_id_local|serie|data_matricula|situacao|inep_id
 */
function generateEducacensoEnrollmentRecord(enrollment: any, studentLocalId: string, classLocalId: string): string {
  const serie = enrollment.grade || '';
  const data_matricula = formatDateEducacenso(enrollment.enrollment_date || enrollment.start_date);
  
  // Mapear status para situação
  const situacaoMap: Record<string, string> = {
    'active': 'MATRICULADO',
    'transferred': 'TRANSFERIDO',
    'completed': 'CONCLUÍDO',
    'dropped': 'DESLIGADO',
    'cancelled': 'CANCELADO'
  };
  const situacao = situacaoMap[enrollment.status] || 'MATRICULADO';
  const inep_id = enrollment.enrollment_number || '';
  
  return `60|${studentLocalId}|${classLocalId}|${serie}|${data_matricula}|${situacao}|${inep_id}`;
}

/**
 * Gerar registro 99 - Trailer
 * Formato: 99|qtd_registros|hash|data_geracao
 */
function generateEducacensoTrailer(totalRecords: number, hash: string): string {
  const data_geracao = new Date().toLocaleDateString('pt-BR');
  return `99|${totalRecords}|${hash}|${data_geracao}`;
}

/**
 * Formatar data para Educacenso (DD/MM/AAAA)
 */
function formatDateEducacenso(date: any): string {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

// Função downloadFile removida - agora usando utilitários compartilhados de @pei/ui

/**
 * Criar lote de exportação no banco
 */
export async function createExportBatch(
  exportName: string,
  exportType: string,
  fileFormat: string,
  filters: any,
  fieldsSelected: string[],
  totalRecords: number
): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, school_id')
    .eq('id', user.user?.id)
    .single();
  
  const { data, error } = await supabase
    .from('export_batches')
    .insert({
      export_name: exportName,
      export_type: exportType,
      file_format: fileFormat,
      filters,
      fields_selected: fieldsSelected,
      total_records: totalRecords,
      created_by: user.user?.id,
      tenant_id: profile?.tenant_id,
      school_id: profile?.school_id,
      status: 'processing'
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return data.id;
}

/**
 * Atualizar status da exportação
 */
export async function updateExportBatch(
  batchId: string,
  status: string,
  fileUrl?: string,
  fileSize?: number
): Promise<void> {
  const { error } = await supabase
    .from('export_batches')
    .update({
      status,
      file_url: fileUrl,
      file_size: fileSize,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    })
    .eq('id', batchId);
  
  if (error) throw error;
}

/**
 * Buscar dados de alunos com filtros
 */
export async function fetchStudentsForExport(filters: any): Promise<Record<string, any>[]> {
  // Se houver filtro de ano letivo, buscar alunos através de student_enrollments
  if (filters.academic_year) {
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('student_enrollments')
      .select(`
        *,
        student:students!student_enrollments_student_id_fkey(
          *,
          school:schools!students_school_id_fkey(school_name, codigo_inep)
        )
      `)
      .eq('academic_year', parseInt(filters.academic_year));
    
    if (enrollmentsError) throw enrollmentsError;
    
    // Aplicar filtros adicionais
    let filteredEnrollments = enrollments || [];
    
    if (filters.school_id) {
      filteredEnrollments = filteredEnrollments.filter(
        (e: any) => e.student?.school_id === filters.school_id
      );
    }
    
    if (filters.is_active !== undefined) {
      filteredEnrollments = filteredEnrollments.filter(
        (e: any) => e.student?.is_active === filters.is_active
      );
    }
    
    // Transformar os dados combinando informações do aluno e da matrícula
    return filteredEnrollments.map((enrollment: any) => {
      const student = enrollment.student || {};
      return {
        ...student,
        // Campos da matrícula no nível raiz para facilitar exportação
        academic_year: enrollment.academic_year,
        grade: enrollment.grade,
        class_name: enrollment.class_name || student.class_name,
        shift: enrollment.shift,
        status_matricula: enrollment.status || student.status_matricula,
        enrollment_date: enrollment.enrollment_date,
        start_date: enrollment.start_date,
        end_date: enrollment.end_date,
        // Manter referência completa da matrícula
        enrollment: enrollment
      };
    });
  }
  
  // Sem filtro de ano letivo, buscar diretamente os alunos
  let query = supabase
    .from('students')
    .select(`
      *,
      school:schools!students_school_id_fkey(school_name, codigo_inep),
      student_enrollments!student_enrollments_student_id_fkey(academic_year, grade, class_name, shift, status)
    `);
  
  if (filters.school_id) {
    query = query.eq('school_id', filters.school_id);
  }
  
  if (filters.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Transformar os dados para facilitar o acesso aos campos de matrícula
  const transformedData = (data || []).map((student: any) => {
    // Se houver matrículas, pegar a primeira
    const enrollment = Array.isArray(student.student_enrollments) 
      ? student.student_enrollments[0] 
      : student.student_enrollments;
    
    return {
      ...student,
      // Adicionar campos de matrícula no nível raiz para facilitar exportação
      academic_year: enrollment?.academic_year,
      grade: enrollment?.grade,
      class_name: enrollment?.class_name || student.class_name,
      shift: enrollment?.shift,
      status_matricula: enrollment?.status || student.status_matricula,
      // Manter o array de matrículas para referência
      enrollments: student.student_enrollments
    };
  });
  
  return transformedData;
}

/**
 * Buscar dados de profissionais com filtros
 */
export async function fetchProfessionalsForExport(filters: any): Promise<Record<string, any>[]> {
  let query = supabase
    .from('professionals')
    .select(`
      *,
      school:schools!professionals_school_id_fkey(school_name)
    `);
  
  if (filters.school_id) {
    query = query.eq('school_id', filters.school_id);
  }
  
  if (filters.professional_role) {
    query = query.eq('professional_role', filters.professional_role);
  }
  
  if (filters.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}











