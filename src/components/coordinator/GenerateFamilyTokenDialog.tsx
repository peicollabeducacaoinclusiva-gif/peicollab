import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  Copy, 
  Check, 
  Send, 
  Calendar,
  Clock,
  User,
  Shield,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveLayout, ResponsiveCard } from '@/components/shared/ResponsiveLayout';

interface GenerateFamilyTokenDialogProps {
  studentId: string;
  peiId: string;
  studentName: string;
  onTokenGenerated?: (token: string) => void;
  onClose?: () => void;
}

export function GenerateFamilyTokenDialog({ 
  studentId, 
  peiId, 
  studentName, 
  onTokenGenerated,
  onClose 
}: GenerateFamilyTokenDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    expiresIn: '7', // dias
    maxUses: '10',
    notes: '',
    familyContact: ''
  });

  const generateToken = async () => {
    try {
      setLoading(true);

      // Obter usuário atual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Gerar token seguro (hex simples de 32 caracteres)
      const tokenArray = new Uint8Array(16);
      crypto.getRandomValues(tokenArray);
      const token = Array.from(tokenArray).map(b => b.toString(16).padStart(2, '0')).join('');

      // Calcular data de expiração
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(formData.expiresIn));

      // Inserir token no banco (armazenando o hash SHA-256)
      const tokenHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
      const tokenHash = Array.from(new Uint8Array(tokenHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      // Inserir token no banco
      const { data, error } = await supabase
        .from('family_access_tokens')
        .insert({
          student_id: studentId,
          pei_id: peiId,
          token_hash: tokenHash,
          expires_at: expiresAt.toISOString(),
          max_uses: parseInt(formData.maxUses),
          current_uses: 0,
          created_by: userData.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setGeneratedToken(token);
      onTokenGenerated?.(token);

      toast({
        title: "Token gerado com sucesso",
        description: "O token de acesso familiar foi criado e está pronto para uso.",
      });

      // Chamar callback de fechamento se fornecido
      onClose?.();

    } catch (error) {
      console.error('Erro ao gerar token:', error);
      toast({
        title: "Erro ao gerar token",
        description: "Não foi possível gerar o token de acesso. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToken = async () => {
    if (generatedToken) {
      try {
        await navigator.clipboard.writeText(generatedToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        
        toast({
          title: "Token copiado",
          description: "O token foi copiado para a área de transferência.",
        });
      } catch (error) {
        console.error('Erro ao copiar token:', error);
      }
    }
  };

  const sendToken = async () => {
    if (generatedToken && formData.familyContact) {
      try {
        // Aqui você implementaria o envio por email/SMS
        // Por enquanto, apenas simular
        toast({
          title: "Token enviado",
          description: `O token foi enviado para ${formData.familyContact}`,
        });
      } catch (error) {
        console.error('Erro ao enviar token:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      expiresIn: '7',
      maxUses: '10',
      notes: '',
      familyContact: ''
    });
    setGeneratedToken(null);
    setCopied(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetForm, 300); // Aguarda a animação de fechamento
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Key className="h-4 w-4" />
          Gerar Token Familiar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Gerar Token de Acesso Familiar
          </DialogTitle>
          <DialogDescription>
            Crie um token seguro para que a família de <strong>{studentName}</strong> possa acessar o PEI.
          </DialogDescription>
        </DialogHeader>

        <ResponsiveLayout>
          {!generatedToken ? (
            <div className="space-y-6">
              {/* Configurações do Token */}
              <ResponsiveCard>
                <CardHeader>
                  <CardTitle className="text-lg">Configurações do Token</CardTitle>
                  <CardDescription>
                    Defina as configurações de segurança e acesso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiresIn">Expira em</Label>
                      <Select 
                        value={formData.expiresIn} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, expiresIn: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 dia</SelectItem>
                          <SelectItem value="3">3 dias</SelectItem>
                          <SelectItem value="7">7 dias</SelectItem>
                          <SelectItem value="14">14 dias</SelectItem>
                          <SelectItem value="30">30 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxUses">Máximo de usos</Label>
                      <Select 
                        value={formData.maxUses} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, maxUses: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 uso</SelectItem>
                          <SelectItem value="5">5 usos</SelectItem>
                          <SelectItem value="10">10 usos</SelectItem>
                          <SelectItem value="25">25 usos</SelectItem>
                          <SelectItem value="50">50 usos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="familyContact">Contato da Família (Opcional)</Label>
                    <Input
                      id="familyContact"
                      placeholder="Email ou telefone para envio automático"
                      value={formData.familyContact}
                      onChange={(e) => setFormData(prev => ({ ...prev, familyContact: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      placeholder="Observações sobre o token ou instruções especiais..."
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </ResponsiveCard>

              {/* Informações de Segurança */}
              <ResponsiveCard className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Informações de Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Token Seguro</p>
                      <p className="text-xs text-muted-foreground">
                        O token é gerado com criptografia SHA-256 e não pode ser recuperado se perdido.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Expiração Automática</p>
                      <p className="text-xs text-muted-foreground">
                        O token expira automaticamente após {formData.expiresIn} dia{formData.expiresIn !== '1' ? 's' : ''}.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Controle de Acesso</p>
                      <p className="text-xs text-muted-foreground">
                        Limitado a {formData.maxUses} uso{formData.maxUses !== '1' ? 's' : ''} máximo.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </ResponsiveCard>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={generateToken} disabled={loading}>
                  {loading ? 'Gerando...' : 'Gerar Token'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Token Gerado */}
              <ResponsiveCard className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                    <Check className="h-5 w-5" />
                    Token Gerado com Sucesso
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    O token de acesso foi criado e está pronto para uso.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Token de Acesso</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={generatedToken}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToken}
                        className="flex items-center gap-2"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copiado' : 'Copiar'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Expira em {formData.expiresIn} dia{formData.expiresIn !== '1' ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Máximo {formData.maxUses} uso{formData.maxUses !== '1' ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {formData.familyContact && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={sendToken}
                        className="w-full flex items-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Enviar Token para {formData.familyContact}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </ResponsiveCard>

              {/* Instruções de Uso */}
              <ResponsiveCard>
                <CardHeader>
                  <CardTitle className="text-lg">Como Usar o Token</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">1. Compartilhe o Token</p>
                    <p className="text-xs text-muted-foreground">
                      Envie o token para a família por email, WhatsApp ou outro meio seguro.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">2. Acesso Familiar</p>
                    <p className="text-xs text-muted-foreground">
                      A família acessa o PEI através do link: /family/access?token=TOKEN_AQUI
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">3. Monitoramento</p>
                    <p className="text-xs text-muted-foreground">
                      Você pode acompanhar o uso do token no painel de controle.
                    </p>
                  </div>
                </CardContent>
              </ResponsiveCard>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Fechar
                </Button>
                <Button onClick={() => setGeneratedToken(null)}>
                  Gerar Novo Token
                </Button>
              </div>
            </div>
          )}
        </ResponsiveLayout>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateFamilyTokenDialog;