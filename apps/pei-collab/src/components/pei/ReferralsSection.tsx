import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Plus, Trash2 } from "lucide-react";

// Tipos baseados no schema do banco
interface PEIReferral {
  id?: string;
  referred_to: string;
  reason?: string;
  date?: string;
  follow_up?: string;
}

interface ReferralsData {
  referrals: PEIReferral[];
  observations: string; // Renomeado de generalObservations para observations para corresponder ao schema
}

interface ReferralsSectionProps {
  referralsData: ReferralsData;
  onReferralsChange: (data: ReferralsData) => void;
}

const ReferralsSection = ({ referralsData, onReferralsChange }: ReferralsSectionProps) => {
  const handleChange = (field: keyof ReferralsData, value: any) => {
    onReferralsChange({ ...referralsData, [field]: value });
  };

  // Garantir que o array existe
  const safeReferrals = referralsData?.referrals || [];

  const addReferral = () => {
    const newReferrals = [
      ...(referralsData?.referrals || []),
      { 
        referred_to: "", 
        reason: "",
        date: new Date().toISOString().split("T")[0] // Formato YYYY-MM-DD
      }
    ];
    handleChange("referrals", newReferrals);
  };

  const removeReferral = (index: number) => {
    const newReferrals = (referralsData?.referrals || []).filter((_, i) => i !== index);
    handleChange("referrals", newReferrals);
  };

  const updateReferral = (index: number, field: keyof PEIReferral, value: string) => {
    const newReferrals = [...(referralsData?.referrals || [])];
    newReferrals[index] = { ...newReferrals[index], [field]: value };
    handleChange("referrals", newReferrals);
  };

  const commonReferralOptions = [
    "Psicólogo",
    "Fonoaudiólogo",
    "Terapeuta Ocupacional",
    "Neurologista",
    "Psicopedagogo",
    "Fisioterapeuta",
    "Assistente Social",
    "Nutricionista",
    "Oftalmologista",
    "Otorrinolaringologista",
    "Psiquiatra",
    "Outro"
  ];

  return (
    <div className="space-y-6">
      <Alert className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
        <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="text-sm text-orange-800 dark:text-orange-300">
          <strong>Importante:</strong> Encaminhe o aluno apenas para profissionais que possam contribuir efetivamente para seu desenvolvimento.
        </AlertDescription>
      </Alert>

      <div>
        <h3 className="text-lg font-semibold mb-4">Encaminhamentos e Observações</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Registre encaminhamentos para profissionais especializados e observações gerais sobre o PEI.
        </p>
      </div>

      <div className="space-y-6">
        {/* Encaminhamentos Profissionais */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="text-base">🏥 Encaminhamentos Profissionais</Label>
            <Button onClick={addReferral} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Encaminhamento
            </Button>
          </div>

          <div className="space-y-4">
            {safeReferrals.map((referral, index) => (
              <Card key={index}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <Label>Encaminhamento {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeReferral(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor={`referred-to-${index}`}>Profissional / Instituição</Label>
                    <div className="mt-2 space-y-2">
                      <Input
                        id={`referred-to-${index}`}
                        placeholder="Ex: Psicólogo, Fonoaudiólogo, etc."
                        value={referral.referred_to}
                        onChange={(e) => updateReferral(index, "referred_to", e.target.value)}
                        list={`referral-options-${index}`}
                      />
                      <datalist id={`referral-options-${index}`}>
                        {commonReferralOptions.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                      <p className="text-xs text-muted-foreground">
                        Sugestões: {commonReferralOptions.slice(0, 5).join(", ")}...
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`reason-${index}`}>Motivo do Encaminhamento</Label>
                    <Textarea
                      id={`reason-${index}`}
                      placeholder="Descreva o motivo do encaminhamento e as expectativas..."
                      value={referral.reason || ""}
                      onChange={(e) => updateReferral(index, "reason", e.target.value)}
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`date-${index}`}>Data do Encaminhamento</Label>
                    <Input
                      id={`date-${index}`}
                      type="date"
                      value={referral.date || ""}
                      onChange={(e) => updateReferral(index, "date", e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`follow-up-${index}`}>Acompanhamento (Opcional)</Label>
                    <Textarea
                      id={`follow-up-${index}`}
                      placeholder="Registre informações sobre o acompanhamento, retornos, feedback do profissional..."
                      value={referral.follow_up || ""}
                      onChange={(e) => updateReferral(index, "follow_up", e.target.value)}
                      rows={2}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {safeReferrals.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Nenhum encaminhamento adicionado ainda</p>
                <Button onClick={addReferral} variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar primeiro encaminhamento
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Observações Gerais */}
        <div>
          <Label htmlFor="observations">📝 Observações Gerais</Label>
          <Textarea
            id="observations"
            placeholder="Adicione observações importantes sobre o acompanhamento, particularidades do aluno, recomendações para família e escola..."
            value={referralsData.observations || ""}
            onChange={(e) => handleChange("observations", e.target.value)}
            rows={6}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Registre informações complementares relevantes para o acompanhamento do PEI
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReferralsSection;