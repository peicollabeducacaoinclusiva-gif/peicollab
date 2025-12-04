// src/components/shared/PageLayout.tsx
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export function PageLayout({ 
  children, 
  title, 
  showBackButton = true,
  backUrl = "/dashboard"
}: PageLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Esquerda: Voltar */}
            <div className="flex items-center gap-4">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(backUrl)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              )}
              {title && (
                <h2 className="text-lg font-semibold hidden md:block">{title}</h2>
              )}
            </div>

            {/* Centro: Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img 
                src="/logo.png" 
                alt="PEI Collab" 
                className="h-10 w-auto cursor-pointer"
                onClick={() => navigate("/dashboard")}
              />
            </div>

            {/* Direita: Ações */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main>
        {children}
      </main>
    </div>
  );
}

