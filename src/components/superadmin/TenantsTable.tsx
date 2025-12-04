import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Power, PowerOff, Trash2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import EditTenantDialog from "./EditTenantDialog";
import DeleteTenantDialog from "./DeleteTenantDialog";

interface Tenant {
  id: string;
  name: string;
  network_name?: string;
  user_count: number;
  student_count: number;
  is_active: boolean;
}

interface TenantsTableProps {
  tenants: Tenant[];
  onTenantUpdated: () => void;
}

const TenantsTable = ({ tenants, onTenantUpdated }: TenantsTableProps) => {
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  const handleToggleStatus = async (tenant: Tenant) => {
    setLoadingId(tenant.id);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ is_active: !tenant.is_active })
        .eq("id", tenant.id);

      if (error) throw error;

      toast({
        title: tenant.is_active ? "Escola desativada" : "Escola ativada",
        description: "Status atualizado com sucesso.",
      });

      onTenantUpdated();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setDeleteDialogOpen(true);
  };

  const handleDeleteComplete = () => {
    setDeleteDialogOpen(false);
    setTenantToDelete(null);
    onTenantUpdated();
  };

  const totalPages = Math.ceil(tenants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTenants = tenants.slice(startIndex, endIndex);

  return (
    <>
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rede de Ensino</TableHead>
              <TableHead>Nome da Escola</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Alunos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhuma escola cadastrada
                </TableCell>
              </TableRow>
            ) : (
              currentTenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>{tenant.network_name || "-"}</TableCell>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell className="font-mono text-xs">
                  {tenant.id.slice(0, 8)}...
                </TableCell>
                <TableCell>{tenant.user_count}</TableCell>
                <TableCell>{tenant.student_count}</TableCell>
                <TableCell>
                  <Badge
                    variant={tenant.is_active ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => handleToggleStatus(tenant)}
                  >
                    {tenant.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(tenant)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(tenant)}
                      disabled={loadingId === tenant.id}
                    >
                      {tenant.is_active ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(tenant)}
                      disabled={loadingId === tenant.id}
                      className="hover:bg-red-50"
                      title="Excluir rede permanentemente"
                    >
                      <Trash2 className="h-4 w-4 text-red-600 hover:text-red-700" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>

      <EditTenantDialog
        tenant={editingTenant}
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingTenant(null);
        }}
        onTenantUpdated={onTenantUpdated}
      />

      <DeleteTenantDialog
        tenant={tenantToDelete}
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTenantToDelete(null);
        }}
        onDeleted={handleDeleteComplete}
      />
    </>
  );
};

export default TenantsTable;
