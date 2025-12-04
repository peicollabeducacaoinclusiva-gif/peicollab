import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Traduções
const resources = {
  'pt-BR': {
    translation: {
      common: {
        save: 'Salvar',
        cancel: 'Cancelar',
        delete: 'Excluir',
        edit: 'Editar',
        create: 'Criar',
        search: 'Buscar',
        filter: 'Filtrar',
        loading: 'Carregando...',
        error: 'Erro',
        success: 'Sucesso',
        confirm: 'Confirmar',
      },
      attendance: {
        title: 'Frequência',
        minimum: 'Frequência Mínima',
        percentage: 'Percentual de Frequência',
        belowThreshold: 'Abaixo do Limite',
        canApprove: 'Pode Aprovar',
        cannotApprove: 'Não Pode Aprovar',
        reason: 'Motivo',
      },
      approval: {
        title: 'Aprovação de Alunos',
        approve: 'Aprovar',
        approved: 'Aprovado',
        pending: 'Pendente',
        eligible: 'Elegível',
        notEligible: 'Não Elegível',
        frequencyCheck: 'Verificação de Frequência',
      },
      alerts: {
        title: 'Alertas',
        frequency: 'Frequência (75%)',
        critical: 'Crítico',
        warning: 'Alerta',
        ok: 'OK',
        total: 'Total de Alertas',
      },
      educacenso: {
        title: 'Educacenso',
        export: 'Exportar Dados',
        validate: 'Validar Dados',
        generating: 'Gerando arquivo...',
        downloaded: 'Arquivo baixado com sucesso',
      },
    },
  },
  'en-US': {
    translation: {
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        search: 'Search',
        filter: 'Filter',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        confirm: 'Confirm',
      },
      attendance: {
        title: 'Attendance',
        minimum: 'Minimum Attendance',
        percentage: 'Attendance Percentage',
        belowThreshold: 'Below Threshold',
        canApprove: 'Can Approve',
        cannotApprove: 'Cannot Approve',
        reason: 'Reason',
      },
      approval: {
        title: 'Student Approval',
        approve: 'Approve',
        approved: 'Approved',
        pending: 'Pending',
        eligible: 'Eligible',
        notEligible: 'Not Eligible',
        frequencyCheck: 'Frequency Check',
      },
      alerts: {
        title: 'Alerts',
        frequency: 'Frequency (75%)',
        critical: 'Critical',
        warning: 'Warning',
        ok: 'OK',
        total: 'Total Alerts',
      },
      educacenso: {
        title: 'Educacenso',
        export: 'Export Data',
        validate: 'Validate Data',
        generating: 'Generating file...',
        downloaded: 'File downloaded successfully',
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt-BR',
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

