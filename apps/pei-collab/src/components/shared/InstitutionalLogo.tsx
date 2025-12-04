import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InstitutionalLogoProps {
  tenantId: string | null;
  userRole: string;
}

const InstitutionalLogo = ({ tenantId, userRole }: InstitutionalLogoProps) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const canEdit = userRole === "education_secretary" || userRole === "superadmin";

  useEffect(() => {
    if (tenantId) {
      loadLogo();
    }
  }, [tenantId]);

  const loadLogo = async () => {
    if (!tenantId) return;
    
    try {
      const { data: files } = await supabase.storage
        .from("school-logos")
        .list(tenantId);

      if (files && files.length > 0) {
        const { data: urlData } = supabase.storage
          .from("school-logos")
          .getPublicUrl(`${tenantId}/${files[0].name}`);
        
        setLogoUrl(urlData.publicUrl);
      }
    } catch (error) {
      console.error("Erro ao carregar logo:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !tenantId) return;

    const fileExt = file.name.split(".").pop();
    if (!fileExt || !["png", "jpg", "jpeg", "svg"].includes(fileExt.toLowerCase())) {
      toast({
        title: "Formato inválido",
        description: "Use apenas PNG, JPG ou SVG",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Deletar logo anterior se existir
      const { data: existingFiles } = await supabase.storage
        .from("school-logos")
        .list(tenantId);

      if (existingFiles && existingFiles.length > 0) {
        await Promise.all(
          existingFiles.map((file) =>
            supabase.storage.from("school-logos").remove([`${tenantId}/${file.name}`])
          )
        );
      }

      const fileName = `logo.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("school-logos")
        .upload(`${tenantId}/${fileName}`, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      toast({
        title: "Sucesso",
        description: "Logo institucional atualizada com sucesso.",
      });

      loadLogo();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const { data: files } = await supabase.storage
        .from("school-logos")
        .list(tenantId);

      if (files && files.length > 0) {
        await supabase.storage
          .from("school-logos")
          .remove(files.map((file) => `${tenantId}/${file.name}`));

        toast({
          title: "Logo removida",
          description: "A logo institucional foi removida com sucesso.",
        });

        setLogoUrl(null);
        setOpen(false);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao remover logo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit && !logoUrl) {
    // Sem logo personalizada - mostra ícone padrão
    return (
      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/10 to-purple-600/10 dark:from-primary/20 dark:to-purple-600/20 flex items-center justify-center border-2 border-primary/20 dark:border-primary/30">
        <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
    );
  }

  const LogoImage = () => (
    <div className="h-12 w-12 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border-2 border-primary/20 dark:border-primary/30 shadow-sm overflow-hidden">
      <img 
        src={logoUrl || "/logo.png"} 
        alt="Logo Institucional" 
        className="h-10 w-10 object-contain cursor-pointer hover:opacity-80 transition-opacity"
      />
    </div>
  );

  if (!canEdit) {
    return <LogoImage />;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="focus:outline-none focus:ring-2 focus:ring-primary rounded">
          <LogoImage />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo Institucional
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {logoUrl && (
            <div className="flex justify-center p-4 border rounded-lg">
              <img
                src={logoUrl}
                alt="Logo institucional"
                className="max-h-32 object-contain"
              />
            </div>
          )}

          <div className="flex gap-2">
            <label htmlFor="logo-upload" className="flex-1 cursor-pointer">
              <Button
                type="button"
                className="w-full"
                disabled={loading}
                variant={logoUrl ? "outline" : "default"}
                asChild
              >
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {logoUrl ? "Trocar Logo" : "Fazer Upload"}
                </span>
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
            </label>

            {logoUrl && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleRemoveLogo}
                disabled={loading}
                title="Remover logo"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Formatos aceitos: PNG, JPG, SVG • Tamanho máximo: 2MB
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstitutionalLogo;
