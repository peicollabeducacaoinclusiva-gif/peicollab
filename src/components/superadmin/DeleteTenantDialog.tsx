import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface DeleteTenantDialogProps {
  tenant: {
    id: string;
    name: string;
    network_name?: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

interface DeleteStats {
  schools: number;
  users: number;
  students: number;
  peis: number;
}

const DeleteTenantDialog = ({ tenant, open, onClose, onDeleted }: DeleteTenantDialogProps) => {
  const [stats, setStats] = useState<DeleteStats>({ schools: 0, users: 0, students: 0, peis: 0 });
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [confirmText, setConfirmText] = useState("");
  const [deleteOptions, setDeleteOptions] = useState({
    schools: true,
    users: true,
    students: true,
    peis: true,
  });
  const { toast } = useToast();

  const tenantName = tenant?.network_name || tenant?.name || "";

  useEffect(() => {
    if (open && tenant) {
      loadStats();
      setConfirmText("");
      setDeleteOptions({
        schools: true,
        users: true,
        students: true,
        peis: true,
      });
    }
  }, [open, tenant]);

  const loadStats = async () => {
    if (!tenant) return;

    setLoadingStats(true);
    try {
      // Contar escolas
      const { count: schoolsCount } = await supabase
        .from("schools")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      // Contar usuários
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      // Contar alunos
      const { count: studentsCount } = await supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      // Contar PEIs
      const { count: peisCount } = await supabase
        .from("peis")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      setStats({
        schools: schoolsCount || 0,
        users: usersCount || 0,
        students: studentsCount || 0,
        peis: peisCount || 0,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleDelete = async () => {
    if (!tenant || confirmText !== tenantName) {
      toast({
        title: "Confirmação incorreta",
        description: `Por favor, digite exatamente: ${tenantName}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Deletar em ordem específica para respeitar foreign keys

      // 1. Deletar PEIs se selecionado
      if (deleteOptions.peis && stats.peis > 0) {
        const { error: peisError } = await supabase
          .from("peis")
          .delete()
          .eq("tenant_id", tenant.id);

        if (peisError) throw new Error(`Erro ao deletar PEIs: ${peisError.message}`);
      }

      // 2. Deletar alunos se selecionado
      if (deleteOptions.students && stats.students > 0) {
        const { error: studentsError } = await supabase
          .from("students")
          .delete()
          .eq("tenant_id", tenant.id);

        if (studentsError) throw new Error(`Erro ao deletar alunos: ${studentsError.message}`);
      }

      // 3. Deletar usuários se selecionado
      if (deleteOptions.users && stats.users > 0) {
        // Buscar IDs dos usuários para deletar do Auth
        const { data: usersToDelete } = await supabase
          .from("profiles")
          .select("id")
          .eq("tenant_id", tenant.id);

        // Deletar profiles (auth users serão deletados em cascata)
        const { error: profilesError } = await supabase
          .from("profiles")
          .delete()
          .eq("tenant_id", tenant.id);

        if (profilesError) throw new Error(`Erro ao deletar usuários: ${profilesError.message}`);

        // Tentar deletar do Auth (pode falhar se não tiver permissão)
        if (usersToDelete && usersToDelete.length > 0) {
          for (const user of usersToDelete) {
            try {
              await supabase.auth.admin.deleteUser(user.id);
            } catch (authError) {
              console.warn(`Não foi possível deletar usuário ${user.id} do Auth:`, authError);
            }
          }
        }
      }

      // 4. Deletar escolas se selecionado
      if (deleteOptions.schools && stats.schools > 0) {
        const { error: schoolsError } = await supabase
          .from("schools")
          .delete()
          .eq("tenant_id", tenant.id);

        if (schoolsError) throw new Error(`Erro ao deletar escolas: ${schoolsError.message}`);
      }

      // 5. Finalmente, deletar a rede
      const { error: tenantError } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenant.id);

      if (tenantError) throw new Error(`Erro ao deletar rede: ${tenantError.message}`);

      // Mensagem de sucesso
      const deletedItems = [];
      if (deleteOptions.peis && stats.peis > 0) deletedItems.push(`${stats.peis} PEI(s)`);
      if (deleteOptions.students && stats.students > 0) deletedItems.push(`${stats.students} aluno(s)`);
      if (deleteOptions.users && stats.users > 0) deletedItems.push(`${stats.users} usuário(s)`);
      if (deleteOptions.schools && stats.schools > 0) deletedItems.push(`${stats.schools} escola(s)`);

      toast({
        title: "Rede excluída com sucesso",
        description: `${tenantName} e ${deletedItems.join(", ")} foram removidos permanentemente.`,
      });

      onDeleted();
      onClose();
    } catch (error: any) {
      console.error("Erro ao excluir rede:", error);
      toast({
        title: "Erro ao excluir rede",
        description: error.message || "Ocorreu um erro ao tentar excluir a rede.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isConfirmValid = confirmText === tenantName;
  const hasSelectedItems = Object.values(deleteOptions).some(v => v);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Excluir Rede Permanentemente
          </DialogTitle>
          <DialogDescription>
            Esta ação é <strong>IRREVERSÍVEL</strong> e excluirá a rede e todos os dados associados.
          </DialogDescription>
        </DialogHeader>

        {loadingStats ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Alerta Principal */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atenção!</AlertTitle>
              <AlertDescription>
                Você está prestes a excluir a rede <strong>"{tenantName}"</strong>.
                Esta ação não pode ser desfeita e todos os dados selecionados serão perdidos permanentemente.
              </AlertDescription>
            </Alert>

            {/* Estatísticas */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Dados que serão afetados:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Escolas</span>
                  <span className="font-bold text-lg">{stats.schools}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Usuários</span>
                  <span className="font-bold text-lg">{stats.users}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Alunos</span>
                  <span className="font-bold text-lg">{stats.students}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">PEIs</span>
                  <span className="font-bold text-lg">{stats.peis}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Opções de Exclusão */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Selecione o que deseja excluir:</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delete-schools"
                    checked={deleteOptions.schools}
                    onCheckedChange={(checked) =>
                      setDeleteOptions({ ...deleteOptions, schools: checked as boolean })
                    }
                    disabled={stats.schools === 0}
                  />
                  <Label htmlFor="delete-schools" className="text-sm cursor-pointer">
                    Excluir {stats.schools} escola(s) associada(s)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delete-users"
                    checked={deleteOptions.users}
                    onCheckedChange={(checked) =>
                      setDeleteOptions({ ...deleteOptions, users: checked as boolean })
                    }
                    disabled={stats.users === 0}
                  />
                  <Label htmlFor="delete-users" className="text-sm cursor-pointer">
                    Excluir {stats.users} usuário(s) da rede
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delete-students"
                    checked={deleteOptions.students}
                    onCheckedChange={(checked) =>
                      setDeleteOptions({ ...deleteOptions, students: checked as boolean })
                    }
                    disabled={stats.students === 0}
                  />
                  <Label htmlFor="delete-students" className="text-sm cursor-pointer">
                    Excluir {stats.students} aluno(s) cadastrado(s)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delete-peis"
                    checked={deleteOptions.peis}
                    onCheckedChange={(checked) =>
                      setDeleteOptions({ ...deleteOptions, peis: checked as boolean })
                    }
                    disabled={stats.peis === 0}
                  />
                  <Label htmlFor="delete-peis" className="text-sm cursor-pointer">
                    Excluir {stats.peis} PEI(s) criado(s)
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Confirmação por Texto */}
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-semibold">
                Para confirmar, digite o nome da rede exatamente como aparece abaixo:
              </Label>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded border">
                {tenantName}
              </p>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite o nome da rede aqui"
                className={confirmText && !isConfirmValid ? "border-red-500" : ""}
              />
              {confirmText && !isConfirmValid && (
                <p className="text-xs text-red-600">
                  O nome não corresponde. Verifique maiúsculas e minúsculas.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || loading || loadingStats || !hasSelectedItems}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Excluir Permanentemente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteTenantDialog;

