import { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabaseClient";
import ManageClassTeachersDialog from "./ManageClassTeachersDialog";

interface School {
  id: string;
  school_name: string;
}

interface Props {
  tenantId: string;
  onTeachersUpdated?: () => void;
}

const GRADES = [
  "1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano",
  "6º Ano", "7º Ano", "8º Ano", "9º Ano",
];

const CLASSES = ["A", "B", "C", "D", "E"];

export default function NetworkClassTeachersSelector({ tenantId, onTeachersUpdated }: Props) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (selectorOpen) {
      loadSchools();
    }
  }, [selectorOpen, tenantId]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schools')
        .select('id, school_name')
        .eq('tenant_id', tenantId)
        .order('school_name');

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error("Erro ao carregar escolas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedSchoolId && selectedGrade && selectedClass) {
      setSelectorOpen(false);
      setTimeout(() => {
        setManageDialogOpen(true);
      }, 100);
    }
  };

  const handleReset = () => {
    setSelectedSchoolId("");
    setSelectedGrade("");
    setSelectedClass("");
  };

  return (
    <>
      {/* Dialog de Seleção */}
      <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            Gerenciar Professores
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar Escola e Turma</DialogTitle>
            <DialogDescription>
              Escolha a escola, série e turma para gerenciar os professores • Ano {currentYear}
            </DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="school">Escola</Label>
                <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                  <SelectTrigger id="school">
                    <SelectValue placeholder="Selecione a escola" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.school_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleReset}>
                  Limpar
                </Button>
                <Button 
                  onClick={handleContinue}
                  disabled={!selectedSchoolId || !selectedGrade || !selectedClass}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Gestão de Professores */}
      {selectedSchoolId && selectedGrade && selectedClass && (
        <ManageClassTeachersDialog
          schoolId={selectedSchoolId}
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

