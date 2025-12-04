import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

interface NetworkInfo {
  id: string;
  network_name: string | null;
  network_address: string | null;
  network_email: string | null;
  network_phone: string | null;
  network_responsible: string | null;
}

interface NetworkInfoCardProps {
  tenants: NetworkInfo[];
  onUpdate: () => void;
}

const NetworkInfoCard = ({ tenants, onUpdate }: NetworkInfoCardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tenantId: "",
    networkName: "",
    networkAddress: "",
    networkEmail: "",
    networkPhone: "",
    networkResponsible: "",
  });

  // Load data from first tenant with network info, or first tenant if none
  useEffect(() => {
    if (tenants.length > 0) {
      const tenantWithNetwork = tenants.find(t => t.network_name) || tenants[0];
      setFormData({
        tenantId: tenantWithNetwork.id,
        networkName: tenantWithNetwork.network_name || "",
        networkAddress: tenantWithNetwork.network_address || "",
        networkEmail: tenantWithNetwork.network_email || "",
        networkPhone: tenantWithNetwork.network_phone || "",
        networkResponsible: tenantWithNetwork.network_responsible || "",
      });
    }
  }, [tenants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          network_name: formData.networkName || null,
          network_address: formData.networkAddress || null,
          network_email: formData.networkEmail || null,
          network_phone: formData.networkPhone || null,
          network_responsible: formData.networkResponsible || null,
        })
        .eq("id", formData.tenantId);

      if (error) throw error;

      toast({
        title: "Dados atualizados!",
        description: "As informações da rede foram salvas com sucesso.",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (tenants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Informações da Rede Municipal</CardTitle>
          <CardDescription>
            Cadastre uma escola primeiro para poder configurar a rede municipal.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Rede Municipal de Ensino</CardTitle>
        <CardDescription>
          Configure os dados gerais da rede municipal de ensino
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="networkName">Nome da Rede Municipal *</Label>
            <Input
              id="networkName"
              value={formData.networkName}
              onChange={(e) => setFormData({ ...formData, networkName: e.target.value })}
              placeholder="Ex: Secretaria Municipal de Educação"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="networkAddress">Endereço</Label>
            <Input
              id="networkAddress"
              value={formData.networkAddress}
              onChange={(e) => setFormData({ ...formData, networkAddress: e.target.value })}
              placeholder="Endereço completo da secretaria"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="networkEmail">E-mail</Label>
            <Input
              id="networkEmail"
              type="email"
              value={formData.networkEmail}
              onChange={(e) => setFormData({ ...formData, networkEmail: e.target.value })}
              placeholder="contato@educacao.gov.br"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="networkPhone">Telefone de Contato</Label>
            <Input
              id="networkPhone"
              type="tel"
              value={formData.networkPhone}
              onChange={(e) => setFormData({ ...formData, networkPhone: e.target.value })}
              placeholder="(00) 0000-0000"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="networkResponsible">Responsável</Label>
            <Input
              id="networkResponsible"
              value={formData.networkResponsible}
              onChange={(e) => setFormData({ ...formData, networkResponsible: e.target.value })}
              placeholder="Nome do responsável pela rede"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Informações
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NetworkInfoCard;
