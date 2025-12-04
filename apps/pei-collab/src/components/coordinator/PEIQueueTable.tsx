import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreVertical, Eye, CheckCircle, XCircle, Trash2, Edit, Key, Users, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PEIVersionHistoryDialog from "@/components/pei/PEIVersionHistoryDialog";

type PEIStatus = 
  | "draft" 
  | "pending_validation" 
  | "returned" 
  | "validated" 
  | "pending_family" 
  | "approved";

interface PEI {
  id: string;
  student_id: string;
  student_name: string;
  teacher_name: string;
  tenant_name: string;
  status: PEIStatus;
  created_at: string;
}

interface PEIQueueTableProps {
  peis: PEI[];
  onViewPEI: (peiId: string) => void;
  onApprovePEI: (peiId: string) => void;
  onReturnPEI: (peiId: string) => void;
  onPEIDeleted: () => void;
  onEditPEI?: (peiId: string, studentId: string) => void;
  onGenerateToken?: (peiId: string) => void;
  onManageTokens?: (peiId: string) => void;
}

const PEIQueueTable = ({
  peis,
  onViewPEI,
  onApprovePEI,
  onReturnPEI,
  onPEIDeleted,
  onEditPEI,
  onGenerateToken,
  onManageTokens,
}: PEIQueueTableProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [peiToDelete, setPeiToDelete] = useState<PEI | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const getStatusBadge = (status: PEIStatus) => {
    const statusConfig: Record<PEIStatus, { label: string; color: string }> = {
      draft: {
        label: "Rascunho",
        color: "bg-gray-500/10 text-gray-700 border-gray-200",
      },
      pending_validation: {
        label: "Pendente",
        color: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
      },
      returned: {
        label: "Devolvido",
        color: "bg-orange-500/10 text-orange-700 border-orange-200",
      },
      validated: {
        label: "Validado",
        color: "bg-blue-500/10 text-blue-700 border-blue-200",
      },
      pending_family: {
        label: "Aguardando Família",
        color: "bg-purple-500/10 text-purple-700 border-purple-200",
      },
      approved: {
        label: "Aprovado",
        color: "bg-green-500/10 text-green-700 border-green-200",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge variant="outline" className={`${config.color} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const handleDeleteClick = (pei: PEI) => {
    setPeiToDelete(pei);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!peiToDelete) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from("peis")
        .delete()
        .eq("id", peiToDelete.id);

      if (error) throw error;

      toast({
        title: "PEI excluído",
        description: "O PEI foi excluído com sucesso.",
      });

      onPEIDeleted();
    } catch (error: any) {
      console.error("Erro ao excluir PEI:", error);
      toast({
        title: "Erro ao excluir PEI",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPeiToDelete(null);
    }
  };

  const canApprove = (status: PEIStatus) => {
    return status === "pending_validation" || status === "validated";
  };

  const canReturn = (status: PEIStatus) => {
    return status === "pending_validation" || status === "validated";
  };

  if (peis.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum PEI encontrado
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Professor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {peis.map((pei) => (
              <TableRow key={pei.id} className="hover:bg-accent/50">
                <TableCell className="font-medium">
                  {pei.student_name}
                </TableCell>
                <TableCell>{pei.teacher_name}</TableCell>
                <TableCell>{getStatusBadge(pei.status)}</TableCell>
                <TableCell>
                  {format(new Date(pei.created_at), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <PEIVersionHistoryDialog
                      studentId={pei.student_id}
                      studentName={pei.student_name}
                      currentPEIId={pei.id}
                      variant="icon"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewPEI(pei.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>

                      {onEditPEI && (
                        <DropdownMenuItem
                          onClick={() => onEditPEI(pei.id, pei.student_id)}
                          className="text-blue-600"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar PEI
                        </DropdownMenuItem>
                      )}

                      {onGenerateToken && (
                        <DropdownMenuItem
                          onClick={() => onGenerateToken(pei.id)}
                          className="text-purple-600"
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Gerar Token
                        </DropdownMenuItem>
                      )}

                      {onManageTokens && (
                        <DropdownMenuItem
                          onClick={() => onManageTokens(pei.id)}
                          className="text-indigo-600"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Gerenciar Tokens
                        </DropdownMenuItem>
                      )}

                      {canApprove(pei.status) && (
                        <DropdownMenuItem
                          onClick={() => onApprovePEI(pei.id)}
                          className="text-green-600"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aprovar
                        </DropdownMenuItem>
                      )}

                      {canReturn(pei.status) && (
                        <DropdownMenuItem
                          onClick={() => onReturnPEI(pei.id)}
                          className="text-orange-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Devolver
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(pei)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o PEI de{" "}
              <strong>{peiToDelete?.student_name}</strong>? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PEIQueueTable;