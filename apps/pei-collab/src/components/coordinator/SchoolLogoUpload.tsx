import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SchoolLogoUploadProps {
  tenantId: string;
  onLogoChange?: () => void;
}

const SchoolLogoUpload = ({ tenantId, onLogoChange }: SchoolLogoUploadProps) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLogo();
  }, [tenantId]);

  const loadLogo = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("school-logos")
        .list(tenantId);

      if (error) throw error;

      if (data && data.length > 0) {
        const { data: urlData } = supabase.storage
          .from("school-logos")
          .getPublicUrl(`${tenantId}/${data[0].name}`);
        
        setLogoUrl(urlData.publicUrl);
      }
    } catch (error) {
      console.error("Erro ao carregar logo:", error);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Erro",
          description: "Por favor, selecione uma imagem válida.",
          variant: "destructive",
        });
        return;
      }

      // Deletar logo anterior se existir
      const { data: existingFiles } = await supabase.storage
        .from("school-logos")
        .list(tenantId);

      if (existingFiles && existingFiles.length > 0) {
        for (const file of existingFiles) {
          await supabase.storage
            .from("school-logos")
            .remove([`${tenantId}/${file.name}`]);
        }
      }

      // Upload novo arquivo
      const fileExt = file.name.split(".").pop();
      const fileName = `logo.${fileExt}`;
      const filePath = `${tenantId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("school-logos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      toast({
        title: "Sucesso!",
        description: "Logo da escola atualizada com sucesso.",
      });

      loadLogo();
      if (onLogoChange) onLogoChange();
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setUploading(true);
      const { data: files } = await supabase.storage
        .from("school-logos")
        .list(tenantId);

      if (files && files.length > 0) {
        const filesToDelete = files.map((file) => `${tenantId}/${file.name}`);
        const { error } = await supabase.storage
          .from("school-logos")
          .remove(filesToDelete);

        if (error) throw error;

        toast({
          title: "Logo removida",
          description: "A logo da escola foi removida com sucesso.",
        });

        setLogoUrl(null);
        if (onLogoChange) onLogoChange();
      }
    } catch (error: any) {
      toast({
        title: "Erro ao remover logo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ImageIcon className="h-4 w-4 mr-2" />
          {logoUrl ? "Alterar Logo" : "Adicionar Logo"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🏫 Logo da Escola</DialogTitle>
          <DialogDescription>
            Faça upload da logo da sua escola para aparecer nos PEIs impressos
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {logoUrl && (
            <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/50">
              <img
                src={logoUrl}
                alt="Logo da escola"
                className="max-h-32 object-contain"
              />
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="logo-upload" className="cursor-pointer">
                <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">
                    {logoUrl ? "Trocar Logo" : "Fazer Upload da Logo"}
                  </span>
                </div>
              </label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>
            {logoUrl && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                disabled={uploading}
                title="Remover logo"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Formatos aceitos: JPG, PNG, SVG. Tamanho máximo: 2MB
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchoolLogoUpload;