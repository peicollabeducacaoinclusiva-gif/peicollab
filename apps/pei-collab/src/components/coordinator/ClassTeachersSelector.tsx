import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen } from "lucide-react";
import ManageClassTeachersDialog from "./ManageClassTeachersDialog";

interface Props {
  schoolId: string;
  onTeachersUpdated?: () => void;
}

const GRADES = [
  "1º Ano",
  "2º Ano",
  "3º Ano",
  "4º Ano",
  "5º Ano",
  "6º Ano",
  "7º Ano",
  "8º Ano",
  "9º Ano",
];

const CLASSES = ["A", "B", "C", "D", "E"];

export default function ClassTeachersSelector({ schoolId, onTeachersUpdated }: Props) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  
  const currentYear = new Date().getFullYear();

  const handleContinue = () => {
    if (selectedGrade && selectedClass) {
      setSelectorOpen(false);
      // Pequeno delay para suavizar transição
      setTimeout(() => {
        setManageDialogOpen(true);
      }, 100);
    }
  };

  const handleReset = () => {
    setSelectedGrade("");
    setSelectedClass("");
  };

  return (
    <>
      {/* Botão e Dialog de Seleção */}
      <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            Gerenciar Professores
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Turma</DialogTitle>
            <DialogDescription>
              Escolha a série e turma para gerenciar os professores • Ano Letivo {currentYear}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="grade">Série</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger id="grade">
                  <SelectValue placeholder="Selecione a série" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="class">Turma</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      Turma {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>
              Limpar
            </Button>
            <Button 
              onClick={handleContinue}
              disabled={!selectedGrade || !selectedClass}
            >
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gestão de Professores */}
      {selectedGrade && selectedClass && (
        <ManageClassTeachersDialog
          schoolId={schoolId}
          academicYear={currentYear}
          grade={selectedGrade}
          className={selectedClass}
          open={manageDialogOpen}
          onOpenChange={(open) => {
            setManageDialogOpen(open);
            if (!open) {
              handleReset();
            }
          }}
          onTeachersUpdated={onTeachersUpdated}
        />
      )}
    </>
  );
}

