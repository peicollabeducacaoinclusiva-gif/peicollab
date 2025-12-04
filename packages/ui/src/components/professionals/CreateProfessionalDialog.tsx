import React, { useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { useToast } from '../../use-toast';

// Enum espelhando o tipo professional_role do banco
type ProfessionalRole =
  | 'professor'
  | 'professor_aee'
  | 'coordenador'
  | 'diretor'
  | 'secretario_educacao'
  | 'profissional_apoio'
  | 'psicologo'
  | 'fonoaudiologo'
  | 'terapeuta_ocupacional'
  | 'assistente_social'
  | 'outros';

// Cliente Supabase próprio do pacote UI, usando as mesmas envs da aplicação
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[CreateProfessionalDialog] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configurados. ' +
      'O diálogo de criação de profissionais não funcionará corretamente.'
  );
}

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

interface CreateProfessionalDialogProps {
  tenantId: string;
  schoolId?: string | null;
  trigger?: React.ReactNode;
  onCreated?: (professionalId: string) => void;
}

export function CreateProfessionalDialog({ tenantId, schoolId, trigger, onCreated }: CreateProfessionalDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<ProfessionalRole>('professor');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | undefined>(schoolId || undefined);
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([]);

  const loadSchools = async () => {
    if (schools.length > 0) return;
    const { data, error } = await supabase
      .from('schools')
      .select('id, school_name')
      .eq('tenant_id', tenantId)
      .order('school_name', { ascending: true });
    if (error) {
      toast({ title: 'Erro ao carregar escolas', description: error.message, variant: 'destructive' });
      return;
    }
    setSchools((data || []).map(s => ({ id: s.id as string, name: (s as any).school_name as string })));
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) loadSchools().catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast({
        title: 'Configuração inválida',
        description: 'Supabase não está configurado corretamente nesta aplicação.',
        variant: 'destructive',
      });
      return;
    }
    if (!fullName || !email || !role) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha nome, email e função.', variant: 'destructive' });
      return;
    }
    if (!selectedSchoolId) {
      toast({ title: 'Selecione a escola', description: 'Escolha uma escola para vincular o profissional.' });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_professional_for_network', {
        p_tenant_id: tenantId,
        p_school_id: selectedSchoolId,
        p_full_name: fullName,
        p_email: email,
        p_professional_role: role,
        p_phone: phone || null,
      });
      if (error) throw error;
      toast({ title: 'Profissional cadastrado', description: `${fullName} foi adicionado com sucesso.` });
      setOpen(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setRole('professor');
      if (onCreated && data) onCreated(data as unknown as string);
    } catch (err: any) {
      toast({ title: 'Erro ao cadastrar', description: err.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button size="sm">Cadastrar Profissional</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Profissional</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@escola.gov.br" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(xx) xxxxx-xxxx" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={role} onValueChange={(v) => setRole(v as ProfessionalRole)}>
                <SelectTrigger><SelectValue placeholder="Selecione a função" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="professor_aee">Professor AEE</SelectItem>
                  <SelectItem value="coordenador">Coordenador</SelectItem>
                  <SelectItem value="diretor">Diretor</SelectItem>
                  <SelectItem value="secretario_educacao">Secretário de Educação</SelectItem>
                  <SelectItem value="profissional_apoio">Profissional de Apoio</SelectItem>
                  <SelectItem value="psicologo">Psicólogo</SelectItem>
                  <SelectItem value="fonoaudiologo">Fonoaudiólogo</SelectItem>
                  <SelectItem value="terapeuta_ocupacional">Terapeuta Ocupacional</SelectItem>
                  <SelectItem value="assistente_social">Assistente Social</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Escola</Label>
              <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                <SelectTrigger><SelectValue placeholder="Selecione a escola" /></SelectTrigger>
                <SelectContent>
                  {schools.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


