import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import defaultLogo from "@/assets/logo.png";

interface InstitutionalLogoProps {
  tenantId: string | null;
  userRole: string;
}

const InstitutionalLogo = ({ tenantId, userRole }: InstitutionalLogoProps) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const canEdit = userRole === "coordinator" || userRole === "superadmin";

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
    return <img src={defaultLogo} alt="PEI Collab" className="h-10 w-auto" />;
  }

  const LogoImage = () => (
    <img 
      src={logoUrl || defaultLogo} 
      alt="Logo Institucional" 
      className="h-10 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
    />
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
