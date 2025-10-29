import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Trash2, Search, Filter } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

interface SimplePEIsTableProps {
  peis: any[];
  onPEIDeleted: () => void;
}

const SimplePEIsTable = ({ peis, onPEIDeleted }: SimplePEIsTableProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [peiToDelete, setPeiToDelete] = useState<any | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleDeleteClick = (pei: any) => {
    setPeiToDelete(pei);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!peiToDelete) return;

    setLoadingId(peiToDelete.id);
    try {
      const { error } = await supabase
        .from("peis")
        .delete()
        .eq("id", peiToDelete.id);

      if (error) throw error;

      toast({
        title: "PEI excluído",
        description: "O PEI foi removido com sucesso.",
      });

      onPEIDeleted();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir PEI",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
      setDeleteDialogOpen(false);
      setPeiToDelete(null);
    }
  };

  // Filtrar PEIs
  const filteredPEIs = (peis || []).filter(pei => {
    if (!pei) return false;
    
    const studentName = pei.students?.name || '';
    const teacherName = pei.assigned_teacher?.full_name || '';
    
    const matchesSearch = !searchTerm || 
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacherName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || pei.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (!peis || peis.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum PEI cadastrado</p>
        <p className="text-sm mt-2">Os PEIs aparecerão aqui quando forem criados</p>
      </div>
    );
  }

  if (filteredPEIs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum PEI encontrado com os filtros aplicados</p>
        <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive", label: string }> = {
      draft: { variant: "secondary", label: "Rascunho" },
      pending_validation: { variant: "default", label: "Pendente Validação" },
      validated: { variant: "outline", label: "Validado" },
      pending_family: { variant: "outline", label: "Aguardando Família" },
      approved: { variant: "outline", label: "Aprovado" },
      returned: { variant: "destructive", label: "Devolvido" },
    };

    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por aluno ou professor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="pending_validation">Pendente Validação</SelectItem>
              <SelectItem value="validated">Validado</SelectItem>
              <SelectItem value="pending_family">Aguardando Família</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="returned">Devolvido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Professor Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Última Atualização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPEIs.map((pei) => {
              if (!pei || !pei.id) return null;
              
              return (
                <TableRow key={pei.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">
                        {pei.students?.name || 'Nome não disponível'}
                      </div>
                      {pei.students?.date_of_birth && (
                        <div className="text-sm text-muted-foreground">
                          Nascido em: {formatDate(pei.students.date_of_birth)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {pei.assigned_teacher?.full_name || 'Não atribuído'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(pei.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {pei.created_at ? formatDate(pei.created_at) : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {pei.updated_at ? formatDate(pei.updated_at) : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          try {
                            navigate(`/pei/edit?pei=${pei.id}&student=${pei.student_id}`);
                          } catch (error) {
                            console.error('Erro na navegação:', error);
                          }
                        }}
                        title="Visualizar PEI"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(pei)}
                        disabled={loadingId === pei.id}
                        title="Excluir PEI"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este PEI? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SimplePEIsTable;

