// Custom Components
export * from './AppSwitcher';

// UI Components
export * from './components/button';
export * from './components/card';
export * from './components/dialog';
export * from './components/tabs';
export * from './components/badge';
export * from './components/label';
export * from './components/input';
export * from './components/select';
export * from './components/textarea';
export * from './components/checkbox';
export * from './components/table';
export * from './components/progress';
export * from './components/form';
export * from './components/switch';
export * from './components/alert';
export * from './components/tooltip';
export * from './components/professionals/CreateProfessionalDialog';
export * from './components/loading';
export * from './components/performance';

// Hooks
export { useToast } from './use-toast';
export * from './hooks';
export * from './hooks/useLogin';

// Utils
export { formatTimestampForFilename, downloadTextFile, downloadBlob } from './lib/download';
export * from './utils/chartExport';
export { getCurrentAppId, getAppName, getAppLogo } from './lib/appUtils';

// Charts
export * from './components/charts/ChartExportButton';

// Dashboard Components
export * from './components/dashboards/KPITooltip';

// Shared Components
export * from './components/shared/AppHeader';
export * from './components/shared/ThemeToggle';
export * from './components/shared/UserMenu';
export * from './components/shared/LoginForm';
export * from './components/shared/ProtectedRoute';
export * from './components/avatar';

// Hooks
export * from './hooks/useUserProfile';

// Accessible Components
export * from './components/accessible';

// i18n (re-export)
export * from '@pei/i18n';

// Error Components
export { ErrorBoundary } from './components/errors/ErrorBoundary';

// SEO Components
export * from './components/seo';

// Performance Components
export * from './components/performance';

export type { UserProfile } from './hooks/useUserProfile';