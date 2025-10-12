import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import EditStudentDialog from "./EditStudentDialog";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface StudentsTableProps {
  students: any[];
  tenants: any[];
  onStudentDeleted: () => void;
}

const StudentsTable = ({ students, tenants, onStudentDeleted }: StudentsTableProps) => {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<any | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleEditClick = (student: any) => {
    setStudentToEdit(student);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (student: any) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;

    setLoadingId(studentToDelete.id);
    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", studentToDelete.id);

      if (error) throw error;

      toast({
        title: "Aluno excluído",
        description: "O aluno foi removido com sucesso.",
      });

      onStudentDeleted();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir aluno",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  if (students.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhum aluno cadastrado
      </p>
    );
  }

  const totalPages = Math.ceil(students.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = students.slice(startIndex, endIndex);

  return (
    <>
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Rede / Escola</TableHead>
            <TableHead>Data de Nascimento</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Responsáveis</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentStudents.map((student) => (
          <TableRow key={student.id}>
            <TableCell className="font-medium">{student.name}</TableCell>
            <TableCell>
              {student.tenants?.network_name && (
                <div className="text-xs text-muted-foreground mb-1">
                  {student.tenants.network_name}
                </div>
              )}
              <div>{student.tenant_name || "N/A"}</div>
            </TableCell>
            <TableCell>
              {student.date_of_birth
                ? format(new Date(student.date_of_birth), "dd/MM/yyyy")
                : "N/A"}
            </TableCell>
            <TableCell>
              <div className="space-y-1 text-sm">
                {student.phone && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Tel:</span>
                    <span>{student.phone}</span>
                  </div>
                )}
                {student.email && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="truncate max-w-[200px]">{student.email}</span>
                  </div>
                )}
                {!student.phone && !student.email && "N/A"}
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                {student.father_name && (
                  <Badge variant="outline" className="mr-1">
                    Pai: {student.father_name}
                  </Badge>
                )}
                {student.mother_name && (
                  <Badge variant="outline">
                    Mãe: {student.mother_name}
                  </Badge>
                )}
                {!student.father_name && !student.mother_name && "N/A"}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditClick(student)}
                  disabled={loadingId === student.id}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteClick(student)}
                  disabled={loadingId === student.id}
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

    <EditStudentDialog
      student={studentToEdit}
      tenants={tenants}
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
      onStudentUpdated={onStudentDeleted}
    />

    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o aluno <strong>{studentToDelete?.name}</strong>? 
            Esta ação removerá todos os PEIs associados e não pode ser desfeita.
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

export default StudentsTable;
