-- Otimização de Performance: Índices Estratégicos
-- Adiciona índices em todas as tabelas principais para melhorar performance em redes grandes

-- ============================================================================
-- ÍNDICES PARA TABELAS DE ALUNOS E MATRÍCULAS
-- ============================================================================

-- Students
CREATE INDEX IF NOT EXISTS idx_students_tenant_school ON "public"."students"("tenant_id", "school_id");
CREATE INDEX IF NOT EXISTS idx_students_school_active ON "public"."students"("school_id", "is_active");
CREATE INDEX IF NOT EXISTS idx_students_name_search ON "public"."students" USING gin(to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_students_cpf ON "public"."students"("cpf") WHERE "cpf" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_date_of_birth ON "public"."students"("date_of_birth");
CREATE INDEX IF NOT EXISTS idx_students_created_at ON "public"."students"("created_at" DESC);

-- Enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON "public"."enrollments"("student_id");
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON "public"."enrollments"("class_id");
CREATE INDEX IF NOT EXISTS idx_enrollments_school_year ON "public"."enrollments"("school_id", "academic_year");
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON "public"."enrollments"("status");
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON "public"."enrollments"("is_active", "academic_year");

-- Enrollment Requests
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_tenant ON "public"."enrollment_requests"("tenant_id", "school_id");
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_status ON "public"."enrollment_requests"("status", "created_at");
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_student ON "public"."enrollment_requests"("student_id");
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_type ON "public"."enrollment_requests"("request_type", "academic_year");

-- ============================================================================
-- ÍNDICES PARA TABELAS PEDAGÓGICAS
-- ============================================================================

-- PEIs
CREATE INDEX IF NOT EXISTS idx_peis_student ON "public"."peis"("student_id");
CREATE INDEX IF NOT EXISTS idx_peis_status ON "public"."peis"("status", "created_at");
CREATE INDEX IF NOT EXISTS idx_peis_active_version ON "public"."peis"("student_id", "is_active_version") WHERE "is_active_version" = true;
CREATE INDEX IF NOT EXISTS idx_peis_tenant ON "public"."peis"("tenant_id", "school_id");

-- Grades
CREATE INDEX IF NOT EXISTS idx_grades_enrollment ON "public"."grades"("enrollment_id");
CREATE INDEX IF NOT EXISTS idx_grades_subject ON "public"."grades"("subject_id");
CREATE INDEX IF NOT EXISTS idx_grades_evaluation ON "public"."grades"("evaluation_config_id");
CREATE INDEX IF NOT EXISTS idx_grades_period ON "public"."grades"("academic_year", "period");
CREATE INDEX IF NOT EXISTS idx_grades_diary_entry ON "public"."grades"("diary_entry_id") WHERE "diary_entry_id" IS NOT NULL;

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_enrollment ON "public"."attendance"("enrollment_id");
CREATE INDEX IF NOT EXISTS idx_attendance_date ON "public"."attendance"("attendance_date");
CREATE INDEX IF NOT EXISTS idx_attendance_period ON "public"."attendance"("academic_year", "period");
CREATE INDEX IF NOT EXISTS idx_attendance_class ON "public"."attendance"("class_id", "attendance_date");

-- Daily Attendance Records (Diário)
CREATE INDEX IF NOT EXISTS idx_daily_attendance_diary ON "public"."daily_attendance_records"("diary_entry_id");
CREATE INDEX IF NOT EXISTS idx_daily_attendance_enrollment ON "public"."daily_attendance_records"("enrollment_id", "attendance_date");
CREATE INDEX IF NOT EXISTS idx_daily_attendance_date ON "public"."daily_attendance_records"("attendance_date");

-- Descriptive Reports
CREATE INDEX IF NOT EXISTS idx_descriptive_reports_student ON "public"."descriptive_reports"("student_id");
CREATE INDEX IF NOT EXISTS idx_descriptive_reports_period ON "public"."descriptive_reports"("academic_year", "period");
CREATE INDEX IF NOT EXISTS idx_descriptive_reports_diary ON "public"."descriptive_reports"("diary_entry_id") WHERE "diary_entry_id" IS NOT NULL;

-- Evaluation Configs
CREATE INDEX IF NOT EXISTS idx_evaluation_configs_school ON "public"."evaluation_configs"("school_id", "academic_year");
CREATE INDEX IF NOT EXISTS idx_evaluation_configs_active ON "public"."evaluation_configs"("is_active", "academic_year");

-- ============================================================================
-- ÍNDICES PARA TABELAS DE GESTÃO ESCOLAR
-- ============================================================================

-- Classes
CREATE INDEX IF NOT EXISTS idx_classes_school ON "public"."classes"("school_id", "academic_year");
CREATE INDEX IF NOT EXISTS idx_classes_grade ON "public"."classes"("grade_level", "academic_year");
CREATE INDEX IF NOT EXISTS idx_classes_active ON "public"."classes"("is_active", "academic_year");
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON "public"."classes"("teacher_id") WHERE "teacher_id" IS NOT NULL;

-- Subjects
CREATE INDEX IF NOT EXISTS idx_subjects_school ON "public"."subjects"("school_id");
CREATE INDEX IF NOT EXISTS idx_subjects_active ON "public"."subjects"("is_active");

-- Class Schedules
CREATE INDEX IF NOT EXISTS idx_class_schedules_class ON "public"."class_schedules"("class_id");
CREATE INDEX IF NOT EXISTS idx_class_schedules_day ON "public"."class_schedules"("day_of_week");
CREATE INDEX IF NOT EXISTS idx_class_schedules_subject ON "public"."class_schedules"("subject_id");

-- Class Diary
CREATE INDEX IF NOT EXISTS idx_class_diary_class ON "public"."class_diary"("class_id", "entry_date");
CREATE INDEX IF NOT EXISTS idx_class_diary_date ON "public"."class_diary"("entry_date");
CREATE INDEX IF NOT EXISTS idx_class_diary_subject ON "public"."class_diary"("subject_id");

-- ============================================================================
-- ÍNDICES PARA TABELAS DE PROFISSIONAIS
-- ============================================================================

-- Professionals
CREATE INDEX IF NOT EXISTS idx_professionals_tenant ON "public"."professionals"("tenant_id", "school_id");
CREATE INDEX IF NOT EXISTS idx_professionals_active ON "public"."professionals"("is_active");
CREATE INDEX IF NOT EXISTS idx_professionals_role ON "public"."professionals"("role");
CREATE INDEX IF NOT EXISTS idx_professionals_name_search ON "public"."professionals" USING gin(to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_professionals_cpf ON "public"."professionals"("cpf") WHERE "cpf" IS NOT NULL;

-- Professional Allocations
CREATE INDEX IF NOT EXISTS idx_professional_allocations_professional ON "public"."professional_allocations"("professional_id");
CREATE INDEX IF NOT EXISTS idx_professional_allocations_class ON "public"."professional_allocations"("class_id");
CREATE INDEX IF NOT EXISTS idx_professional_allocations_active ON "public"."professional_allocations"("is_active", "start_date");

-- ============================================================================
-- ÍNDICES PARA TABELAS DE COMUNICAÇÃO
-- ============================================================================

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_sender ON "public"."messages"("sender_id", "created_at");
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON "public"."messages"("recipient_id", "read_at");
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON "public"."messages"("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS idx_messages_unread ON "public"."messages"("recipient_id", "read_at") WHERE "read_at" IS NULL;

-- Announcements
CREATE INDEX IF NOT EXISTS idx_announcements_tenant ON "public"."announcements"("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS idx_announcements_school ON "public"."announcements"("school_id", "created_at");
CREATE INDEX IF NOT EXISTS idx_announcements_active ON "public"."announcements"("is_active", "expires_at");

-- ============================================================================
-- ÍNDICES PARA TABELAS DE CALENDÁRIO
-- ============================================================================

-- Academic Calendars
CREATE INDEX IF NOT EXISTS idx_academic_calendars_school ON "public"."academic_calendars"("school_id", "academic_year");
CREATE INDEX IF NOT EXISTS idx_academic_calendars_active ON "public"."academic_calendars"("is_active", "academic_year");

-- Calendar Events
CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar ON "public"."calendar_events"("calendar_id", "event_date");
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON "public"."calendar_events"("event_date");
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON "public"."calendar_events"("event_type", "event_date");

-- ============================================================================
-- ÍNDICES PARA TABELAS DE CERTIFICADOS E DOCUMENTOS
-- ============================================================================

-- Certificates
CREATE INDEX IF NOT EXISTS idx_certificates_student ON "public"."certificates"("student_id");
CREATE INDEX IF NOT EXISTS idx_certificates_type ON "public"."certificates"("certificate_type", "issued_at");
CREATE INDEX IF NOT EXISTS idx_certificates_school ON "public"."certificates"("school_id", "issued_at");

-- ============================================================================
-- ÍNDICES PARA TABELAS DE DIÁRIO ESCOLAR
-- ============================================================================

-- Diary Occurrences
CREATE INDEX IF NOT EXISTS idx_diary_occurrences_student ON "public"."diary_occurrences"("student_id", "occurrence_date");
CREATE INDEX IF NOT EXISTS idx_diary_occurrences_class ON "public"."diary_occurrences"("class_id", "occurrence_date");
CREATE INDEX IF NOT EXISTS idx_diary_occurrences_type ON "public"."diary_occurrences"("occurrence_type");

-- Individual Attendances
CREATE INDEX IF NOT EXISTS idx_individual_attendances_student ON "public"."individual_attendances"("student_id", "attendance_date");
CREATE INDEX IF NOT EXISTS idx_individual_attendances_type ON "public"."individual_attendances"("attendance_type");

-- Diary Public Links
CREATE INDEX IF NOT EXISTS idx_diary_public_links_enrollment ON "public"."diary_public_links"("enrollment_id");
CREATE INDEX IF NOT EXISTS idx_diary_public_links_token ON "public"."diary_public_links"("token");
CREATE INDEX IF NOT EXISTS idx_diary_public_links_active ON "public"."diary_public_links"("is_active", "expires_at");

-- Diary Templates
CREATE INDEX IF NOT EXISTS idx_diary_templates_school ON "public"."diary_templates"("school_id", "is_active");
CREATE INDEX IF NOT EXISTS idx_diary_templates_type ON "public"."diary_templates"("template_type", "is_active");

-- ============================================================================
-- ÍNDICES PARA TABELAS DE AUDITORIA E BACKUP
-- ============================================================================

-- Audit Log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON "public"."audit_log"("table_name", "record_id");
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON "public"."audit_log"("changed_by", "changed_at");
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON "public"."audit_log"("changed_at" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON "public"."audit_log"("action", "changed_at");

-- Backup Executions
CREATE INDEX IF NOT EXISTS idx_backup_executions_job ON "public"."backup_executions"("backup_job_id", "started_at");
CREATE INDEX IF NOT EXISTS idx_backup_executions_status ON "public"."backup_executions"("status", "started_at");

-- ============================================================================
-- ÍNDICES COMPOSTOS PARA QUERIES COMUNS
-- ============================================================================

-- Busca de alunos por escola e ano letivo
CREATE INDEX IF NOT EXISTS idx_students_school_year ON "public"."students"("school_id", "created_at");

-- Matrículas ativas por turma
CREATE INDEX IF NOT EXISTS idx_enrollments_class_active ON "public"."enrollments"("class_id", "is_active") WHERE "is_active" = true;

-- Notas por período e aluno
CREATE INDEX IF NOT EXISTS idx_grades_student_period ON "public"."grades"("enrollment_id", "academic_year", "period");

-- Frequência por período e aluno
CREATE INDEX IF NOT EXISTS idx_attendance_student_period ON "public"."attendance"("enrollment_id", "academic_year", "period");

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON INDEX idx_students_tenant_school IS 'Otimiza buscas de alunos por tenant e escola';
COMMENT ON INDEX idx_enrollments_class_active IS 'Otimiza contagem de matrículas ativas por turma';
COMMENT ON INDEX idx_grades_student_period IS 'Otimiza consulta de notas por aluno e período';
COMMENT ON INDEX idx_attendance_student_period IS 'Otimiza consulta de frequência por aluno e período';








