import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { PWAUpdatePrompt } from "@/components/shared/PWAUpdatePrompt";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";
import { PendingChangesIndicator } from "@/components/shared/PendingChangesIndicator";
import { LoadingFallback } from "@/components/shared/LoadingFallback";
import { useSyncOnReconnect } from "@/hooks/useSyncOnReconnect";

// Lazy load components
const Splash = lazy(() => import("./pages/Splash"));
const Auth = lazy(() => import("./pages/Auth"));
const Testes = lazy(() => import("./pages/Testes"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreatePEI = lazy(() => import("./pages/CreatePEI"));
const FamilyAccess = lazy(() => import("./pages/FamilyAccess"));
const FamilyPEIView = lazy(() => import("./pages/FamilyPEIView"));
const SecureFamilyAccess = lazy(() => import("./pages/SecureFamilyAccess"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Students = lazy(() => import("./pages/Students"));
const PEIs = lazy(() => import("./pages/PEIs"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const DatabaseDebug = lazy(() => import("./pages/debug/Database"));
const UsabilityDebug = lazy(() => import("./pages/debug/Usability"));
const NotificationsDebug = lazy(() => import("./pages/debug/Notifications"));
const DebugUser = lazy(() => import("./components/dashboards/DebugUser"));
const PEIOrientations = lazy(() => import("./pages/PEIOrientations"));
const PEIMeetings = lazy(() => import("./pages/PEIMeetings"));
const DatabaseTestRunner = lazy(() => import("./components/debug/DatabaseTestRunner"));
const UsabilityTestingManager = lazy(() => import("./components/debug/UsabilityTestingManager"));
const NotificationManager = lazy(() => import("./components/shared/NotificationManager"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Dados considerados "frescos" por 5 minutos
      gcTime: 1000 * 60 * 30, // Mantém no cache por 30 minutos
      retry: 1, // Tenta novamente 1 vez se falhar
      refetchOnWindowFocus: false, // Não refetch ao focar a janela (economiza requisições)
      refetchOnReconnect: true, // Refetch quando reconectar à internet
    },
  },
});

function App() {
  useSyncOnReconnect(); // Hook para sincronizar dados ao reconectar

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PWAUpdatePrompt />
          <div className="fixed top-2 right-2 z-50">
            <OfflineIndicator />
          </div>
          <div className="fixed top-2 left-2 z-50">
            <PendingChangesIndicator />
          </div>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Splash />} />
                <Route path="/teste" element={<Testes />} />
                <Route path="/debuguser" element={<DebugUser />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/home" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pei/new" element={<CreatePEI />} />
                <Route path="/pei/edit" element={<CreatePEI />} />
                <Route path="/pei/:peiId/orientations" element={<PEIOrientations />} />
                <Route path="/pei/:peiId/meetings" element={<PEIMeetings />} />
                <Route path="/family" element={<FamilyAccess />} />
                <Route path="/family/pei/:peiId" element={<FamilyPEIView />} />
                <Route path="/secure-family" element={<SecureFamilyAccess />} />
                {/* Novas rotas do menu lateral */}
                <Route path="/students" element={<Students />} />
                <Route path="/peis" element={<PEIs />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                
                {/* Rotas de debug */}
                <Route path="/debug/database" element={<DatabaseDebug />} />
                <Route path="/debug/usability" element={<UsabilityDebug />} />
                <Route path="/debug/notifications" element={<NotificationsDebug />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
