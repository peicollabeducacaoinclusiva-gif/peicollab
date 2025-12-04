import { supabase } from '@pei/database';

export type OccurrenceType = 'behavioral' | 'pedagogical' | 'administrative' | 'attendance' | 'other';
export type OccurrenceSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Occurrence {
  id: string;
  tenant_id: string;
  school_id?: string;
  student_id: string;
  enrollment_id?: string;
  class_id: string;
  subject_id?: string;
  diary_entry_id?: string;
  occurrence_type: OccurrenceType;
  severity: OccurrenceSeverity;
  title: string;
  description: string;
  date: string;
  location?: string;
  witnesses?: string[];
  actions_taken?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  document_url?: string;
  reported_by: string;
  status: 'open' | 'resolved' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface IndividualAttendance {
  id: string;
  tenant_id: string;
  student_id: string;
  enrollment_id?: string;
  class_id: string;
  subject_id?: string;
  diary_entry_id?: string;
  attendance_date: string;
  attendance_type: 'individual' | 'group' | 'special_needs';
  description: string;
  objectives?: string[];
  activities_performed?: string;
  observations?: string;
  next_steps?: string;
  conducted_by: string;
  created_at: string;
  updated_at: string;
}

export const occurrenceService = {
  async getOccurrences(filters: {
    tenantId: string;
    studentId?: string;
    classId?: string;
    occurrenceType?: OccurrenceType;
    status?: string;
    dateStart?: string;
    dateEnd?: string;
  }) {
    let query = supabase
      .from('diary_occurrences')
      .select(`
        *,
        students:student_id(name, registration_number),
        classes:class_id(class_name),
        subjects:subject_id(subject_name),
        reported_by_profile:reported_by(full_name)
      `)
      .eq('tenant_id', filters.tenantId);

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters.classId) {
      query = query.eq('class_id', filters.classId);
    }

    if (filters.occurrenceType) {
      query = query.eq('occurrence_type', filters.occurrenceType);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.dateStart) {
      query = query.gte('date', filters.dateStart);
    }

    if (filters.dateEnd) {
      query = query.lte('date', filters.dateEnd);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getOccurrenceById(occurrenceId: string) {
    const { data, error } = await supabase
      .from('diary_occurrences')
      .select(`
        *,
        students:student_id(*),
        classes:class_id(*),
        subjects:subject_id(*),
        reported_by_profile:reported_by(full_name)
      `)
      .eq('id', occurrenceId)
      .single();

    if (error) throw error;
    return data;
  },

  async createOccurrence(occurrence: Partial<Occurrence>) {
    const { data, error } = await supabase
      .from('diary_occurrences')
      .insert({
        tenant_id: occurrence.tenant_id,
        school_id: occurrence.school_id,
        student_id: occurrence.student_id,
        enrollment_id: occurrence.enrollment_id,
        class_id: occurrence.class_id,
        subject_id: occurrence.subject_id,
        diary_entry_id: occurrence.diary_entry_id,
        occurrence_type: occurrence.occurrence_type || 'other',
        severity: occurrence.severity || 'medium',
        title: occurrence.title,
        description: occurrence.description,
        date: occurrence.date || new Date().toISOString().split('T')[0],
        location: occurrence.location,
        witnesses: occurrence.witnesses || [],
        actions_taken: occurrence.actions_taken,
        follow_up_required: occurrence.follow_up_required ?? false,
        follow_up_date: occurrence.follow_up_date,
        document_url: occurrence.document_url,
        reported_by: occurrence.reported_by,
        status: occurrence.status || 'open',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOccurrence(occurrenceId: string, updates: Partial<Occurrence>) {
    const { data, error } = await supabase
      .from('diary_occurrences')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', occurrenceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getIndividualAttendances(filters: {
    tenantId: string;
    studentId?: string;
    classId?: string;
    dateStart?: string;
    dateEnd?: string;
  }) {
    let query = supabase
      .from('individual_attendances')
      .select(`
        *,
        students:student_id(name),
        classes:class_id(class_name),
        subjects:subject_id(subject_name),
        conducted_by_profile:conducted_by(full_name)
      `)
      .eq('tenant_id', filters.tenantId);

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters.classId) {
      query = query.eq('class_id', filters.classId);
    }

    if (filters.dateStart) {
      query = query.gte('attendance_date', filters.dateStart);
    }

    if (filters.dateEnd) {
      query = query.lte('attendance_date', filters.dateEnd);
    }

    const { data, error } = await query.order('attendance_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createIndividualAttendance(attendance: Partial<IndividualAttendance>) {
    const { data, error } = await supabase
      .from('individual_attendances')
      .insert({
        tenant_id: attendance.tenant_id,
        student_id: attendance.student_id,
        enrollment_id: attendance.enrollment_id,
        class_id: attendance.class_id,
        subject_id: attendance.subject_id,
        diary_entry_id: attendance.diary_entry_id,
        attendance_date: attendance.attendance_date || new Date().toISOString().split('T')[0],
        attendance_type: attendance.attendance_type || 'individual',
        description: attendance.description,
        objectives: attendance.objectives || [],
        activities_performed: attendance.activities_performed,
        observations: attendance.observations,
        next_steps: attendance.next_steps,
        conducted_by: attendance.conducted_by,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

