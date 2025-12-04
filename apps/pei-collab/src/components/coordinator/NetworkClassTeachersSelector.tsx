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
import { Input } from "@/components/ui/input";
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

// Estrutura de níveis educacionais e séries
const EDUCATIONAL_LEVELS = {
  "EDUCAÇÃO INFANTIL": {
    label: "EDUCAÇÃO INFANTIL (0-5 anos)",
    grades: [
      { value: "Berçário 1", label: "Berçário 1 (0 a 1 ano)" },
      { value: "Berçário 2", label: "Berçário 2 (1 a 2 anos)" },
      { value: "Maternal", label: "Maternal (2 a 3 anos)" },
      { value: "Infantil 4", label: "Infantil 4 (4 anos)" },
      { value: "Infantil 5", label: "Infantil 5 (5 anos)" },
    ],
  },
  "ENSINO FUNDAMENTAL": {
    label: "ENSINO FUNDAMENTAL (6-14 anos)",
    grades: [
      { value: "1º Ano EF", label: "1º Ano EF (6 anos)" },
      { value: "2º Ano EF", label: "2º Ano EF (7 anos)" },
      { value: "3º Ano EF", label: "3º Ano EF (8 anos)" },
      { value: "4º Ano EF", label: "4º Ano EF (9 anos)" },
      { value: "5º Ano EF", label: "5º Ano EF (10 anos)" },
      { value: "6º Ano EF", label: "6º Ano EF (11 anos)" },
      { value: "7º Ano EF", label: "7º Ano EF (12 anos)" },
      { value: "8º Ano EF", label: "8º Ano EF (13 anos)" },
      { value: "9º Ano EF", label: "9º Ano EF (14 anos)" },
    ],
  },
  "ENSINO MÉDIO": {
    label: "ENSINO MÉDIO (15-17 anos)",
    grades: [
      { value: "1º Ano EM", label: "1º Ano EM (15 anos)" },
      { value: "2º Ano EM", label: "2º Ano EM (16 anos)" },
      { value: "3º Ano EM", label: "3º Ano EM (17 anos)" },
    ],
  },
  "EJA": {
    label: "EJA - EDUCAÇÃO DE JOVENS E ADULTOS (15+ anos)",
    grades: [
      { value: "EJA - Anos Iniciais (EF)", label: "EJA - Anos Iniciais (EF) - 1º ao 5º ano" },
      { value: "EJA - Anos Finais (EF)", label: "EJA - Anos Finais (EF) - 6º ao 9º ano" },
      { value: "EJA - Ensino Médio", label: "EJA - Ensino Médio - 1ª a 3ª série" },
    ],
  },
};

const SHIFTS = [
  { value: "Manhã", label: "Manhã" },
  { value: "Tarde", label: "Tarde" },
  { value: "Noite", label: "Noite" },
];

export default function NetworkClassTeachersSelector({ tenantId, onTeachersUpdated }: Props) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<keyof typeof EDUCATIONAL_LEVELS | "">("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [className, setClassName] = useState("");
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
    if (selectedSchoolId && selectedLevel && selectedGrade && selectedShift && className.trim()) {
      setSelectorOpen(false);
      setTimeout(() => {
        setManageDialogOpen(true);
      }, 100);
    }
  };

  const handleReset = () => {
    setSelectedSchoolId("");
    setSelectedLevel("");
    setSelectedGrade("");
    setSelectedShift("");
    setClassName("");
  };

  const handleLevelChange = (level: keyof typeof EDUCATIONAL_LEVELS) => {
    setSelectedLevel(level);
    setSelectedGrade(""); // Reset grade when level changes
  };

  const availableGrades = selectedLevel ? EDUCATIONAL_LEVELS[selectedLevel].grades : [];

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
              Escolha a escola, nível educacional, série/ano, turno e nome da turma para gerenciar os professores • Ano {currentYear}
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
                <Label htmlFor="level">Nível Educacional</Label>
                <Select value={selectedLevel} onValueChange={handleLevelChange}>
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Selecione o nível educacional" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(EDUCATIONAL_LEVELS).map((level) => (
                      <SelectItem key={level} value={level}>
                        {EDUCATIONAL_LEVELS[level as keyof typeof EDUCATIONAL_LEVELS].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="grade">Série/Ano</Label>
                <Select 
                  value={selectedGrade} 
                  onValueChange={setSelectedGrade}
                  disabled={!selectedLevel}
                >
                  <SelectTrigger id="grade">
                    <SelectValue placeholder={selectedLevel ? "Selecione a série/ano" : "Primeiro selecione o nível educacional"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGrades.map((grade) => (
                      <SelectItem key={grade.value} value={grade.value}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="shift">Turno</Label>
                <Select value={selectedShift} onValueChange={setSelectedShift}>
                  <SelectTrigger id="shift">
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIFTS.map((shift) => (
                      <SelectItem key={shift.value} value={shift.value}>
                        {shift.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="className">Nome da Turma</Label>
                <Input
                  id="className"
                  type="text"
                  placeholder="Ex: A, B, C, 1, 2, Manhã, Tarde, etc."
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Digite o nome ou identificação da turma (ex: A, B, 1, 2, Manhã, Tarde)
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleReset}>
                  Limpar
                </Button>
                <Button 
                  onClick={handleContinue}
                  disabled={!selectedSchoolId || !selectedLevel || !selectedGrade || !selectedShift || !className.trim()}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Gestão de Professores */}
      {selectedSchoolId && selectedLevel && selectedGrade && selectedShift && className.trim() && (
        <ManageClassTeachersDialog
          schoolId={selectedSchoolId}
          academicYear={currentYear}
          grade={selectedGrade}
          className={className.trim()}
          shift={selectedShift}
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

