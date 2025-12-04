import { supabase } from '../client';
import { eventBus, EventPayload } from './eventBus';

/**
 * Handler: Quando aluno é criado → criar pré-PEI e pré-AEE
 */
async function handleStudentCreated(payload: EventPayload) {
  const studentId = payload.data.id;
  const schoolId = payload.data.school_id;
  const tenantId = payload.data.tenant_id;

  if (!studentId || !schoolId || !tenantId) return;

  try {
    // Verificar se já existe PEI ativo
    const { data: existingPEI } = await supabase
      .from('peis')
      .select('id')
      .eq('student_id', studentId)
      .eq('is_active_version', true)
      .single();

    // Criar pré-PEI se não existir
    if (!existingPEI) {
      const { data: pei, error: peiError } = await supabase
        .from('peis')
        .insert({
          student_id: studentId,
          school_id: schoolId,
          tenant_id: tenantId,
          status: 'draft',
          version_number: 1,
          is_active_version: true,
          created_by: payload.userId,
        })
        .select('id')
        .single();

      if (peiError) {
        console.error('Erro ao criar pré-PEI:', peiError);
      } else if (pei) {
        // Emitir evento de PEI criado
        await eventBus.emit('pei.created', {
          id: pei.id,
          student_id: studentId,
          school_id: schoolId,
          tenant_id: tenantId,
        });
      }
    }

    // Verificar se já existe AEE ativo
    const { data: existingAEE } = await supabase
      .from('plano_aee')
      .select('id')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Criar pré-AEE se não existir
    if (!existingAEE) {
      const { data: aee, error: aeeError } = await supabase
        .from('plano_aee')
        .insert({
          student_id: studentId,
          status: 'draft',
        })
        .select('id')
        .single();

      if (aeeError) {
        console.error('Erro ao criar pré-AEE:', aeeError);
      } else if (aee) {
        // Emitir evento de AEE criado
        await eventBus.emit('aee.created', {
          id: aee.id,
          student_id: studentId,
        });
      }
    }
  } catch (error) {
    console.error('Erro no handler student.created:', error);
  }
}

/**
 * Handler: Quando turma muda → recalcular vínculos
 */
async function handleClassChanged(payload: EventPayload) {
  const classId = payload.data.id;
  const studentIds = payload.data.student_ids || [];

  if (!classId) return;

  try {
    // Recalcular vínculos de professores com a turma
    const { data: teachers } = await supabase
      .from('class_teachers')
      .select('teacher_id')
      .eq('class_id', classId);

    if (teachers && teachers.length > 0) {
      const teacherIds = teachers.map((t) => t.teacher_id);

      // Atualizar student_access para professores da turma
      for (const studentId of studentIds) {
        for (const teacherId of teacherIds) {
          await supabase
            .from('student_access')
            .upsert(
              {
                student_id: studentId,
                user_id: teacherId,
                role: 'teacher',
              },
              { onConflict: 'student_id,user_id' }
            );
        }
      }
    }
  } catch (error) {
    console.error('Erro no handler class.changed:', error);
  }
}

/**
 * Handler: Quando professor é designado → habilitar permissões
 */
async function handleTeacherAssigned(payload: EventPayload) {
  const teacherId = payload.data.teacher_id;
  const classId = payload.data.class_id;
  const studentIds = payload.data.student_ids || [];

  if (!teacherId || !classId) return;

  try {
    // Habilitar acesso aos alunos da turma
    for (const studentId of studentIds) {
      await supabase
        .from('student_access')
        .upsert(
          {
            student_id: studentId,
            user_id: teacherId,
            role: 'teacher',
          },
          { onConflict: 'student_id,user_id' }
        );

      // Adicionar como colaborador nos PEIs dos alunos
      const { data: peis } = await supabase
        .from('peis')
        .select('id')
        .eq('student_id', studentId)
        .eq('is_active_version', true);

      if (peis) {
        for (const pei of peis) {
          await supabase
            .from('pei_collaborators')
            .upsert(
              {
                pei_id: pei.id,
                user_id: teacherId,
                role: 'editor',
                permissions: {},
              },
              { onConflict: 'pei_id,user_id' }
            );
        }
      }
    }
  } catch (error) {
    console.error('Erro no handler teacher.assigned:', error);
  }
}

/**
 * Handler: Quando PEI é aprovado → notificar família
 */
async function handlePEIApproved(payload: EventPayload) {
  const peiId = payload.data.id;
  const studentId = payload.data.student_id;

  if (!peiId || !studentId) return;

  try {
    // Buscar família do aluno
    const { data: families } = await supabase
      .from('student_family')
      .select('family_user_id')
      .eq('student_id', studentId);

    if (families && families.length > 0) {
      // Criar notificações para a família
      const notifications = families.map((family) => ({
        user_id: family.family_user_id,
        pei_id: peiId,
        notification_type: 'pei_approved',
        is_read: false,
      }));

      await supabase.from('pei_notifications').insert(notifications);

      // Emitir evento para webhook
      await eventBus.emit('pei.approved', {
        id: peiId,
        student_id: studentId,
        family_user_ids: families.map((f) => f.family_user_id),
      });
    }
  } catch (error) {
    console.error('Erro no handler pei.approved:', error);
  }
}

/**
 * Handler: Quando sessão AEE é registrada → atualizar PEI
 */
async function handleAEESessionRecorded(payload: EventPayload) {
  const aeeId = payload.data.aee_id;
  const studentId = payload.data.student_id;
  const sessionData = payload.data.session_data;

  if (!aeeId || !studentId || !sessionData) return;

  try {
    // Buscar PEI ativo do aluno
    const { data: pei } = await supabase
      .from('peis')
      .select('id, evaluation_data')
      .eq('student_id', studentId)
      .eq('is_active_version', true)
      .single();

    if (pei) {
      // Atualizar evaluation_data com informações da sessão AEE
      const currentEvaluation = pei.evaluation_data || {};
      const updatedEvaluation = {
        ...currentEvaluation,
        aee_sessions: [
          ...(currentEvaluation.aee_sessions || []),
          {
            aee_id: aeeId,
            session_date: sessionData.date,
            notes: sessionData.notes,
            progress: sessionData.progress,
            created_at: new Date().toISOString(),
          },
        ],
        last_aee_update: new Date().toISOString(),
      };

      await supabase
        .from('peis')
        .update({ evaluation_data: updatedEvaluation })
        .eq('id', pei.id);

      // Emitir evento de atualização do PEI
      await eventBus.emit('pei.updated', {
        id: pei.id,
        student_id: studentId,
        update_type: 'aee_session',
      });
    }
  } catch (error) {
    console.error('Erro no handler aee.session.recorded:', error);
  }
}

/**
 * Registra todos os handlers
 */
export function registerEventHandlers() {
  eventBus.on('student.created', handleStudentCreated);
  eventBus.on('class.changed', handleClassChanged);
  eventBus.on('class.updated', handleClassChanged);
  eventBus.on('teacher.assigned', handleTeacherAssigned);
  eventBus.on('pei.approved', handlePEIApproved);
  eventBus.on('aee.session.recorded', handleAEESessionRecorded);
}

// Registrar handlers automaticamente
if (typeof window !== 'undefined') {
  registerEventHandlers();
}

