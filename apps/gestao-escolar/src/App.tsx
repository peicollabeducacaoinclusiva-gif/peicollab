import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@pei/auth';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { ErrorBoundary } from './components/ErrorBoundary';
import './lib/i18n'; // Inicializar i18n
import ProtectedRoute from './components/ProtectedRoute';
import { SearchProvider } from './components/search/SearchProvider';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

// Módulos
import { ModuleGuard } from './core/components/ModuleGuard';
import { ModuleNotAvailable } from './core/components/ModuleNotAvailable';
import { AtividadesRoutes } from './modules/atividades';
import { BlogAdminRoutes } from './modules/blog';
import { MerendaRoutes } from './modules/merenda';
import { PlanejamentoRoutes } from './modules/planejamento';
import { TransporteRoutes } from './modules/transporte';

// Lazy loading para melhor performance
const ModuleManagement = lazy(() => import('./pages/superadmin/ModuleManagement'));
const Students = lazy(() => import('./pages/Students'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const StudentProfileRefactored = lazy(() => import('./pages/StudentProfileRefactored'));
const StudentLearningHistory = lazy(() => import('./pages/StudentLearningHistory'));
const Professionals = lazy(() => import('./pages/Professionals'));
const Classes = lazy(() => import('./pages/Classes'));
const Enrollments = lazy(() => import('./pages/Enrollments'));
const Diary = lazy(() => import('./pages/Diary'));
const Communication = lazy(() => import('./pages/Communication'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Finance = lazy(() => import('./pages/Finance'));
const ReportCards = lazy(() => import('./pages/ReportCards'));
const Calendars = lazy(() => import('./pages/Calendars'));
const Schedules = lazy(() => import('./pages/Schedules'));
const Censo = lazy(() => import('./pages/Censo'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const Transport = lazy(() => import('./pages/Transport'));
const Meals = lazy(() => import('./pages/Meals'));
const AutomaticAlerts = lazy(() => import('./pages/AutomaticAlerts'));
const AlertRules = lazy(() => import('./pages/AlertRules'));
const ScheduledJobs = lazy(() => import('./pages/ScheduledJobs'));
const Subjects = lazy(() => import('./pages/Subjects'));
const Users = lazy(() => import('./pages/Users'));
const Import = lazy(() => import('./pages/Import'));
const Export = lazy(() => import('./pages/Export'));
const Evaluations = lazy(() => import('./pages/Evaluations'));
const StudentHistory = lazy(() => import('./pages/StudentHistory'));
const PerformanceTracking = lazy(() => import('./pages/PerformanceTracking'));
const Certificates = lazy(() => import('./pages/Certificates'));
const Reports = lazy(() => import('./pages/Reports'));
const StaffManagement = lazy(() => import('./pages/StaffManagement'));
const BackupManagement = lazy(() => import('./pages/BackupManagement'));
const AuditReports = lazy(() => import('./pages/AuditReports'));
const Documents = lazy(() => import('./pages/Documents'));
const LGPDManagement = lazy(() => import('./pages/LGPDManagement'));
const GovernmentReports = lazy(() => import('./pages/GovernmentReports'));
const RetentionDashboard = lazy(() => import('./pages/RetentionDashboard'));
const StudentApproval = lazy(() => import('./pages/StudentApproval'));
const DiaryPublicView = lazy(() => import('./components/DiaryPublicView').then(m => ({ default: m.DiaryPublicView })));
const SecretariatDashboard = lazy(() => import('./pages/SecretariatDashboard'));
const TransfersList = lazy(() => import('./pages/secretariat/TransfersList'));
const TransferForm = lazy(() => import('./pages/secretariat/TransferForm'));
const TransferDetail = lazy(() => import('./pages/secretariat/TransferDetail'));
const OccurrencesList = lazy(() => import('./pages/secretariat/OccurrencesList'));
const OccurrenceForm = lazy(() => import('./pages/secretariat/OccurrenceForm'));
const OccurrenceDetail = lazy(() => import('./pages/secretariat/OccurrenceDetail'));
const TicketsList = lazy(() => import('./pages/secretariat/TicketsList'));
const TicketForm = lazy(() => import('./pages/secretariat/TicketForm'));
const TicketDetail = lazy(() => import('./pages/secretariat/TicketDetail'));
const DocumentsList = lazy(() => import('./pages/secretariat/DocumentsList'));
const DocumentRequestForm = lazy(() => import('./pages/secretariat/DocumentRequestForm'));
const SchoolDashboard = lazy(() => import('./pages/dashboards/SchoolDashboard'));
const NetworkDashboard = lazy(() => import('./pages/dashboards/NetworkDashboard'));

// Componente de loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              <Toaster position="top-right" richColors />
              <BrowserRouter>
                <SearchProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/diary/public/:enrollmentId"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DiaryPublicView />
                  </Suspense>
                }
              />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route
                path="/students"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Students />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/students/:studentId/profile"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <StudentProfileRefactored />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              {/* Rota alternativa para a versão antiga caso precise */}
              <Route
                path="/students/:studentId/profile/old"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <StudentProfile />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/students/:studentId/history"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <StudentLearningHistory />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/professionals"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Professionals />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classes"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Classes />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/enrollments"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Enrollments />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/diary"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Diary />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/communication"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Communication />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Alerts />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Finance />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report-cards"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ReportCards />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendars"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Calendars />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schedules"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Schedules />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/censo"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Censo />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/monitoring"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Monitoring />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transport"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Transport />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/meals"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Meals />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/automatic-alerts"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <AutomaticAlerts />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alert-rules"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <AlertRules />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scheduled-jobs"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ScheduledJobs />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subjects"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Subjects />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Users />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/import"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Import />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/export"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Export />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/evaluations"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Evaluations />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student-history"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <StudentHistory />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/performance-tracking"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <PerformanceTracking />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certificates"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Certificates />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Reports />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff-management"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <StaffManagement />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backup"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <BackupManagement />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <AuditReports />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Documents />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/secretariat"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <SecretariatDashboard />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/secretariat/transfers"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <TransfersList />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/secretariat/transfers/new"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <TransferForm />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/secretariat/transfers/:transferId"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <TransferDetail />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/secretariat/occurrences"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <OccurrencesList />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/secretariat/occurrences/new"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <OccurrenceForm />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/secretariat/occurrences/:occurrenceId"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <OccurrenceDetail />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/secretariat/tickets"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <TicketsList />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/secretariat/tickets/new"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <TicketForm />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/secretariat/tickets/:ticketId"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <TicketDetail />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/secretariat/documents"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <DocumentsList />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/secretariat/documents/new"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <DocumentRequestForm />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboards/school"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <SchoolDashboard />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboards/network"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <NetworkDashboard />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lgpd"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <LGPDManagement />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/retention"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <RetentionDashboard />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/government-reports"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <GovernmentReports />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student-approval"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <StudentApproval />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/superadmin/modules"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ModuleManagement />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* MÓDULOS COM GUARD */}
              <Route
                path="/modulo-nao-disponivel"
                element={<ModuleNotAvailable />}
              />
              
              <Route
                path="/atividades/*"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="atividades">
                      <Suspense fallback={<PageLoader />}>
                        <AtividadesRoutes />
                      </Suspense>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/admin/blog/*"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="blog">
                      <Suspense fallback={<PageLoader />}>
                        <BlogAdminRoutes />
                      </Suspense>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/merenda/*"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="merenda">
                      <Suspense fallback={<PageLoader />}>
                        <MerendaRoutes />
                      </Suspense>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/planejamento/*"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="planejamento">
                      <Suspense fallback={<PageLoader />}>
                        <PlanejamentoRoutes />
                      </Suspense>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/transporte/*"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="transporte">
                      <Suspense fallback={<PageLoader />}>
                        <TransporteRoutes />
                      </Suspense>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
            </Routes>
                </SearchProvider>
              </BrowserRouter>
            </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;

