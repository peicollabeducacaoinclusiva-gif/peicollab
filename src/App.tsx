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
import { ThemeProvider } from "next-themes"; // Adicione esta linha
import { PWAUpdatePrompt } from "@/components/shared/PWAUpdatePrompt";
import DebugUser from "./components/dashboards/DebugUser";
//import { OfflineIndicator } from "@/components/shared/OfflineIndicator";
//import { useSyncOnReconnect } from '@/hooks/useSyncOnReconnect';
//import { PendingChangesIndicator } from '@/components/shared/PendingChangesIndicator';

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
//useSyncOnReconnect(); // Hook para sincronizar dados ao reconectar
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>

      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/*<PWAUpdatePrompt />  Adicione aqui */}
        {/*  <OfflineIndicator /> Adicione aqui */}
        {/*<PendingChangesIndicator />  Adicione aqui */}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/teste" element={<Testes />} />
            <Route path="/debuguser" element={<DebugUser />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pei/new" element={<CreatePEI />} />
            <Route path="/pei/edit" element={<CreatePEI />} />
            <Route path="/family" element={<FamilyAccess />} />
            <Route path="/family/pei/:peiId" element={<FamilyPEIView />} />
            <Route path="/secure-family" element={<SecureFamilyAccess />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
