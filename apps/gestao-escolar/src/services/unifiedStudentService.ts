import { supabase } from '@pei/database';

export interface UnifiedStudentData {
  student: {
    id: string;
    name: string;
    date_of_birth?: string;
    registration_number?: string;
    class_name?: string;
    mother_name?: string;
    father_name?: string;
    email?: string;
    phone?: string;
    necessidades_especiais?: boolean;
    tipo_necessidade?: string[];
    school_id: string;
    tenant_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  school: {
    id: string;
    school_name: string;
    school_address?: string;
    school_email?: string;
    school_phone?: string;
  };
  tenant: {
    id: string;
    network_name: string;
  };
  active_pei?: {
    id: string;
    status: string;
    version_number: number;
    created_at: string;
    updated_at: string;
    goals_count: number;
    barriers_count: number;
  };
  active_aee?: {
    id: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  current_enrollment?: {
    id: string;
    grade?: string;
    shift?: string;
    academic_year?: string;
    status: string;
    class_id?: string;
  };
  documents?: Array<{
    id: string;
    type: string;
    title: string;
    created_at: string;
  }>;
  academic_history?: Array<{
    academic_year: string;
    grade?: string;
    shift?: string;
    status: string;
    created_at: string;
  }>;
  accessibility_indicators: {
    has_pei: boolean;
    has_aee: boolean;
    has_adaptations: boolean;
    needs_special_attention: boolean;
  };
}

export interface StudentHistory {
  academic_year: string;
  grade?: string;
  shift?: string;
  status: string;
  created_at: string;
}

export interface StudentNEE {
  necessidades_especiais: boolean;
  tipo_necessidade?: string[];
  pei?: {
    id: string;
    status: string;
    barriers?: Array<{
      id: string;
      barrier_type: string;
      description: string;
      severity: string;
    }>;
  };
  aee?: {
    id: string;
    status: string;
  };
}

export interface StudentDocument {
  id: string;
  type: string;
  title: string;
  created_at: string;
  file_url?: string;
}

export interface StudentAccessibility {
  has_pei: boolean;
  has_aee: boolean;
  has_adaptations: boolean;
  needs_special_attention: boolean;
  adaptations?: Array<{
    id: string;
    type: string;
    description: string;
  }>;
}

export const unifiedStudentService = {
  /**
   * Busca dados completos do estudante unificados
   */
  async getUnifiedStudentData(studentId: string): Promise<UnifiedStudentData> {
    const { data, error } = await supabase.rpc('get_student_unified_data', {
      p_student_id: studentId,
    });

    if (error) throw error;
    return data as UnifiedStudentData;
  },

  /**
   * Busca histórico escolar do estudante
   */
  async getStudentHistory(studentId: string): Promise<StudentHistory[]> {
    const { data, error } = await supabase
      .from('student_enrollments')
      .select('academic_year, grade, shift, status, created_at')
      .eq('student_id', studentId)
      .order('academic_year', { ascending: false });

    if (error) throw error;
    return (data || []) as StudentHistory[];
  },

  /**
   * Busca necessidades educacionais especiais do estudante
   */
  async getStudentNEE(studentId: string): Promise<StudentNEE> {
    // Buscar dados do estudante
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('necessidades_especiais, tipo_necessidade')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Buscar PEI ativo
    const { data: pei } = await supabase
      .from('peis')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('is_active_version', true)
      .single();

    let barriers: StudentNEE['pei'] extends { barriers: infer T } ? T : never = undefined;
    if (pei) {
      const { data: barriersData } = await supabase
        .from('pei_barriers')
        .select('id, barrier_type, description, severity')
        .eq('pei_id', pei.id);

      barriers = barriersData as any;
    }

    // Buscar AEE ativo
    const { data: aee } = await supabase
      .from('plano_aee')
      .select('id, status')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      necessidades_especiais: student?.necessidades_especiais || false,
      tipo_necessidade: student?.tipo_necessidade || [],
      pei: pei
        ? {
            id: pei.id,
            status: pei.status,
            barriers: barriers as any,
          }
        : undefined,
      aee: aee
        ? {
            id: aee.id,
            status: aee.status,
          }
        : undefined,
    };
  },

  /**
   * Busca documentos do estudante
   */
  async getStudentDocuments(studentId: string): Promise<StudentDocument[]> {
    const { data, error } = await supabase
      .from('official_documents')
      .select('id, document_type, title, created_at, file_url')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as StudentDocument[];
  },

  /**
   * Busca indicadores de acessibilidade do estudante
   */
  async getStudentAccessibility(studentId: string): Promise<StudentAccessibility> {
    // Buscar PEI ativo
    const { data: pei } = await supabase
      .from('peis')
      .select('id')
      .eq('student_id', studentId)
      .eq('is_active_version', true)
      .single();

    // Buscar AEE ativo
    const { data: aee } = await supabase
      .from('plano_aee')
      .select('id')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Buscar adaptações (barreiras do PEI)
    let adaptations: StudentAccessibility['adaptations'] = undefined;
    if (pei) {
      const { data: barriers } = await supabase
        .from('pei_barriers')
        .select('id, barrier_type, description')
        .eq('pei_id', pei.id);

      adaptations = (barriers || []).map((b) => ({
        id: b.id,
        type: b.barrier_type || '',
        description: b.description || '',
      }));
    }

    // Buscar dados do estudante
    const { data: student } = await supabase
      .from('students')
      .select('necessidades_especiais')
      .eq('id', studentId)
      .single();

    return {
      has_pei: !!pei,
      has_aee: !!aee,
      has_adaptations: (adaptations?.length || 0) > 0,
      needs_special_attention: student?.necessidades_especiais || false,
      adaptations,
    };
  },
};

