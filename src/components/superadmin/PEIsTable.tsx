import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
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
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PEIsTableProps {
  peis: any[];
  onPEIDeleted: () => void;
}

const PEIsTable = ({ peis, onPEIDeleted }: PEIsTableProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [peiToDelete, setPeiToDelete] = useState<any | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  if (peis.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhum PEI cadastrado
      </p>
    );
  }

  const totalPages = Math.ceil(peis.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPEIs = peis.slice(startIndex, endIndex);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive", label: string }> = {
      draft: { variant: "secondary", label: "Rascunho" },
      pending: { variant: "default", label: "Pendente" },
      approved: { variant: "outline", label: "Aprovado" },
      returned: { variant: "destructive", label: "Devolvido" },
    };

    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aluno</TableHead>
            <TableHead>Escola</TableHead>
            <TableHead>Professor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentPEIs.map((pei) => (
          <TableRow key={pei.id}>
            <TableCell className="font-medium">{pei.student_name}</TableCell>
            <TableCell>{pei.tenant_name}</TableCell>
            <TableCell>{pei.teacher_name}</TableCell>
            <TableCell>{getStatusBadge(pei.status)}</TableCell>
            <TableCell>
              {format(new Date(pei.created_at), "dd/MM/yyyy")}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/create-pei?id=${pei.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(pei)}
                  disabled={loadingId === pei.id}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
          ))}
        </TableBody>
      </Table>

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

    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o PEI do aluno <strong>{peiToDelete?.student_name}</strong>? 
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default PEIsTable;
