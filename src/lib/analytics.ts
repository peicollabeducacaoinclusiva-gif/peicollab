// src/lib/analytics.ts
// Analytics e tracking de eventos do PEI Collab

import { track } from '@vercel/analytics';

// Tipos de eventos
export type EventCategory = 'Auth' | 'PEI' | 'Dashboard' | 'Sync' | 'User' | 'Admin';

// Habilitar apenas em produção
const isProduction = import.meta.env.PROD;

// Função helper para enviar eventos
const sendEvent = (category: EventCategory, action: string, label?: string, value?: number) => {
  if (!isProduction) {
    console.log(`[Analytics] ${category} - ${action}`, { label, value });
    return;
  }

  track(action, {
    category,
    label: label || '',
    value: value || 0
  });
};

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================

export const trackLogin = (role: string) => {
  sendEvent('Auth', 'login', role);
};

export const trackLogout = (role: string) => {
  sendEvent('Auth', 'logout', role);
};

export const trackSignup = (role: string) => {
  sendEvent('Auth', 'signup', role);
};

export const trackPasswordReset = () => {
  sendEvent('Auth', 'password_reset');
};

// ============================================================================
// PEI (Planos Educacionais Individualizados)
// ============================================================================

export const trackPEICreated = (role: string, studentId?: string) => {
  sendEvent('PEI', 'created', role);
};

export const trackPEISubmitted = (role: string, peiId: string) => {
  sendEvent('PEI', 'submitted', role);
};

export const trackPEIApproved = (role: string, peiId: string) => {
  sendEvent('PEI', 'approved', role);
};

export const trackPEIReturned = (role: string, peiId: string) => {
  sendEvent('PEI', 'returned', role);
};

export const trackPEIDeleted = (role: string, peiId: string) => {
  sendEvent('PEI', 'deleted', role);
};

export const trackPEIViewed = (role: string, peiId: string) => {
  sendEvent('PEI', 'viewed', role);
};

export const trackPEIEdited = (role: string, peiId: string) => {
  sendEvent('PEI', 'edited', role);
};

export const trackPEIVersionCreated = (peiId: string, versionNumber: number) => {
  sendEvent('PEI', 'version_created', peiId, versionNumber);
};

export const trackFamilyTokenGenerated = (peiId: string) => {
  sendEvent('PEI', 'family_token_generated', peiId);
};

export const trackFamilyApproval = (peiId: string, approved: boolean) => {
  sendEvent('PEI', 'family_approval', approved ? 'approved' : 'denied');
};

// ============================================================================
// DASHBOARDS
// ============================================================================

export const trackDashboardView = (dashboard: string, role: string) => {
  sendEvent('Dashboard', `view_${dashboard}`, role);
};

export const trackTabChange = (dashboard: string, tab: string) => {
  sendEvent('Dashboard', `tab_${tab}`, dashboard);
};

export const trackFilterApplied = (filterType: string, value: string) => {
  sendEvent('Dashboard', `filter_${filterType}`, value);
};

export const trackReportGenerated = (reportType: string, role: string) => {
  sendEvent('Dashboard', 'report_generated', `${reportType}_by_${role}`);
};

// ============================================================================
// SINCRONIZAÇÃO
// ============================================================================

export const trackSyncStarted = (itemsToSync: number) => {
  sendEvent('Sync', 'started', 'items', itemsToSync);
};

export const trackSyncCompleted = (itemsSynced: number, duration: number) => {
  sendEvent('Sync', 'completed', 'items', itemsSynced);
  sendEvent('Sync', 'duration', 'ms', duration);
};

export const trackSyncFailed = (error: string) => {
  sendEvent('Sync', 'failed', error);
};

export const trackOfflineModeEnabled = () => {
  sendEvent('Sync', 'offline_mode_enabled');
};

export const trackOnlineModeRestored = () => {
  sendEvent('Sync', 'online_mode_restored');
};

// ============================================================================
// USUÁRIOS E GESTÃO
// ============================================================================

export const trackStudentCreated = (role: string) => {
  sendEvent('User', 'student_created', role);
};

export const trackStudentImported = (count: number) => {
  sendEvent('User', 'students_imported', 'count', count);
};

export const trackUserInvited = (role: string, invitedRole: string) => {
  sendEvent('User', 'user_invited', `${role}_invited_${invitedRole}`);
};

export const trackProfileUpdated = (role: string) => {
  sendEvent('User', 'profile_updated', role);
};

// ============================================================================
// ADMINISTRAÇÃO
// ============================================================================

export const trackSchoolCreated = (role: string) => {
  sendEvent('Admin', 'school_created', role);
};

export const trackTenantCreated = (role: string) => {
  sendEvent('Admin', 'tenant_created', role);
};

export const trackBackupPerformed = (type: string) => {
  sendEvent('Admin', 'backup_performed', type);
};

export const trackAuditLogViewed = (role: string) => {
  sendEvent('Admin', 'audit_log_viewed', role);
};

// ============================================================================
// PWA
// ============================================================================

export const trackPWAInstalled = () => {
  sendEvent('User', 'pwa_installed');
};

export const trackPWAUpdateAccepted = () => {
  sendEvent('User', 'pwa_update_accepted');
};

export const trackPWAUpdateDismissed = () => {
  sendEvent('User', 'pwa_update_dismissed');
};

// ============================================================================
// PERFORMANCE
// ============================================================================

export const trackPageLoadTime = (page: string, duration: number) => {
  if (isProduction) {
    track('page_load_time', {
      category: 'Dashboard',
      label: page,
      value: Math.round(duration)
    });
  }
};

export const trackSlowQuery = (queryName: string, duration: number) => {
  if (duration > 1000) { // Apenas queries > 1s
    sendEvent('Dashboard', 'slow_query', queryName, Math.round(duration));
  }
};

// ============================================================================
// ERROS
// ============================================================================

export const trackError = (component: string, error: string) => {
  sendEvent('Admin', 'error', `${component}: ${error.substring(0, 100)}`);
};

export const trackRLSError = (table: string, operation: string) => {
  sendEvent('Admin', 'rls_error', `${table}_${operation}`);
};

// ============================================================================
// UTILITÁRIOS
// ============================================================================

// Rastrear tempo de permanência em uma página
export class PageTimer {
  private startTime: number;
  private pageName: string;

  constructor(pageName: string) {
    this.pageName = pageName;
    this.startTime = Date.now();
  }

  end() {
    const duration = Date.now() - this.startTime;
    trackPageLoadTime(this.pageName, duration);
  }
}

// Rastrear interações de usuário
export const trackUserInteraction = (action: string, element: string) => {
  sendEvent('User', `interaction_${action}`, element);
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Auth
  trackLogin,
  trackLogout,
  trackSignup,
  trackPasswordReset,
  
  // PEI
  trackPEICreated,
  trackPEISubmitted,
  trackPEIApproved,
  trackPEIReturned,
  trackPEIViewed,
  trackPEIEdited,
  trackFamilyTokenGenerated,
  trackFamilyApproval,
  
  // Dashboard
  trackDashboardView,
  trackTabChange,
  trackReportGenerated,
  
  // Sync
  trackSyncStarted,
  trackSyncCompleted,
  trackSyncFailed,
  
  // Users
  trackStudentCreated,
  trackUserInvited,
  
  // PWA
  trackPWAInstalled,
  trackPWAUpdateAccepted,
  
  // Errors
  trackError,
  trackRLSError,
  
  // Utils
  PageTimer,
  trackUserInteraction
};

