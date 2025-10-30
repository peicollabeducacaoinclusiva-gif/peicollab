import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Testes from "./pages/Testes";
import Dashboard from "./pages/Dashboard";
import CreatePEI from "./pages/CreatePEI";
import FamilyAccess from "./pages/FamilyAccess";
import FamilyPEIView from "./pages/FamilyPEIView";
import SecureFamilyAccess from "./pages/SecureFamilyAccess";
import NotFound from "./pages/NotFound";
import Students from "./pages/Students";
import PEIs from "./pages/PEIs";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import DatabaseDebug from "./pages/debug/Database";
import UsabilityDebug from "./pages/debug/Usability";
import NotificationsDebug from "./pages/debug/Notifications";
import { ThemeProvider } from "next-themes";
import { PWAUpdatePrompt } from "@/components/shared/PWAUpdatePrompt";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";
import { PendingChangesIndicator } from "@/components/shared/PendingChangesIndicator";
import { useSyncOnReconnect } from "@/hooks/useSyncOnReconnect";
import DebugUser from "./components/dashboards/DebugUser";
import PEIOrientations from "./pages/PEIOrientations";
import PEIMeetings from "./pages/PEIMeetings";
import { DatabaseTestRunner } from "./components/debug/DatabaseTestRunner";
import { UsabilityTestingManager } from "./components/debug/UsabilityTestingManager";
import { NotificationManager } from "./components/shared/NotificationManager";

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
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
