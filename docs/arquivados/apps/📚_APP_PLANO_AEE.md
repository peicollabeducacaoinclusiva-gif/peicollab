# 📚 App de Plano de AEE (Atendimento Educacional Especializado)

> **📌 Versão Atual**: V1.0  
> **🚀 Próxima Versão**: Ver [`🚀_APP_PLANO_AEE_V2.md`](./🚀_APP_PLANO_AEE_V2.md) - Visão Futura Completa  
> **📋 Roadmap**: Ver [`📋_ROADMAP_PLANO_AEE.md`](./📋_ROADMAP_PLANO_AEE.md) - Evolução V1.0 → V2.0

## 🎯 Visão Geral

O **App de Plano de AEE** é uma aplicação independente do monorepo PEI Collab V3, dedicada à criação, gestão e acompanhamento de **Planos de Atendimento Educacional Especializado**. Este app permite que professores de AEE criem e gerenciem planos detalhados para alunos com necessidades especiais, incluindo diagnósticos, barreiras de aprendizagem, recursos, adaptações e avaliações cíclicas.

---

## 🏗️ Arquitetura

### **Localização no Monorepo**

```
pei-collab/
├── apps/
│   └── plano-aee/          ← App independente de Plano de AEE
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Dashboard.tsx
│       │   │   ├── CreatePlanoAEE.tsx
│       │   │   ├── EditPlanoAEE.tsx
│       │   │   ├── ViewPlanoAEE.tsx
│       │   │   └── Login.tsx
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
```

### **Porta de Desenvolvimento**

- **Porta**: `http://localhost:5175`
- **Comando**: `pnpm dev` (na raiz do monorepo)

---

## 🗄️ Estrutura de Dados

### **Tabela Principal: `plano_aee`**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | Identificador único do plano |
| `pei_id` | uuid | Vinculação opcional com um PEI |
| `student_id` | uuid | ID do aluno (obrigatório) |
| `school_id` | uuid | ID da escola (obrigatório) |
| `tenant_id` | uuid | ID do tenant (obrigatório) |
| `created_by` | uuid | Criador do plano (professor AEE) |
| `assigned_aee_teacher_id` | uuid | Professor AEE responsável |
| `status` | text | Status: `draft`, `pending`, `approved`, `returned`, `archived` |
| `version` | integer | Versão do plano (padrão: 1) |
| `start_date` | date | Data de início |
| `end_date` | date | Data de término |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Data de atualização |

### **Seções do Plano (Campos JSONB)**

#### **1. Ferramentas de Diagnóstico** (`diagnosis_tools`)
```json
[
  {
    "disability_type": "Deficiência Intelectual",
    "tool_name": "WISC-IV",
    "tool_description": "Escala Wechsler de Inteligência",
    "applied_date": "2025-01-15",
    "results": "QI Total: 65 (Deficiência Intelectual Leve)"
  }
]
```

#### **2. Anamnese** (`anamnesis_data`)
```json
{
  "medical_history": "Histórico médico do aluno",
  "developmental_history": "Desenvolvimento motor e cognitivo",
  "family_context": "Contexto familiar e social",
  "previous_interventions": "Intervenções anteriores realizadas"
}
```

#### **3. Barreiras de Aprendizagem** (`learning_barriers`)
```json
[
  {
    "barrier_type": "Cognitiva",
    "description": "Dificuldade em compreensão de conceitos abstratos",
    "severity": "high",
    "identified_date": "2025-02-01"
  }
]
```

#### **4. Recursos e Adaptações**
- **Recursos** (`resources`): Materiais e equipamentos disponíveis
- **Adaptações** (`adaptations`): Curriculares, arquitetônicas, comunicacionais, metodológicas

#### **5. Objetivos de Ensino** (`teaching_objectives`)
```json
[
  {
    "objective": "Desenvolver autonomia em atividades diárias",
    "skills_to_develop": "Autocuidado, organização pessoal",
    "expected_timeline": "6 meses",
    "success_criteria": "Realiza 80% das atividades sem auxílio"
  }
]
```

#### **6. Avaliação**
- **Metodologia** (`evaluation_methodology`): Descrição dos métodos
- **Instrumentos** (`evaluation_instruments`): Ferramentas usadas

#### **7. Acompanhamentos** (`follow_ups`)
Registros de sessões e observações periódicas

#### **8. Encaminhamentos** (`referrals`)
Encaminhamentos para profissionais especializados (fonoaudiólogo, psicólogo, etc.)

#### **9. Orientações**
- `family_guidance`: Para a família
- `school_guidance`: Para a escola
- `other_guidance`: Outras orientações

#### **10. Avaliações Cíclicas**
- `cycle_1_evaluation`: I Ciclo (Março)
- `cycle_2_evaluation`: II Ciclo (Junho)
- `cycle_3_evaluation`: III Ciclo (Novembro)

### **Tabelas Relacionadas**

#### **`plano_aee_comments`**
Sistema de comentários colaborativos no plano

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | ID do comentário |
| `plano_aee_id` | uuid | Plano relacionado |
| `user_id` | uuid | Autor do comentário |
| `comment_text` | text | Conteúdo do comentário |
| `section` | text | Seção específica comentada |
| `comment_type` | text | `general`, `suggestion`, `question`, `approval`, `concern` |
| `parent_comment_id` | uuid | Para respostas (thread) |
| `is_resolved` | boolean | Se foi resolvido |

#### **`plano_aee_attachments`**
Anexos (laudos, relatórios, avaliações)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | ID do anexo |
| `plano_aee_id` | uuid | Plano relacionado |
| `file_name` | text | Nome do arquivo |
| `file_path` | text | Caminho no storage |
| `attachment_type` | text | `laudo`, `relatorio`, `avaliacao`, `outros` |
| `uploaded_by` | uuid | Quem fez o upload |

---

## 🎨 Interfaces do Usuário

### **1. Dashboard (`/`)**

**Funcionalidades:**
- ✅ Visão geral de todos os planos de AEE
- ✅ Estatísticas: Total, Rascunhos, Em Revisão, Aprovados
- ✅ Listagem de planos com filtros
- ✅ Indicadores de ciclos avaliados
- ✅ Ações rápidas: Criar, Editar, Visualizar

**Componentes:**
- Cards de estatísticas
- Tabela de planos
- Badges de status
- Botão de criar novo plano

### **2. Criar Plano (`/create`)**

**Funcionalidades:**
- ✅ Seleção de aluno
- ✅ Campos iniciais: Queixa da Escola, Queixa da Família
- ✅ Criação rápida e redirecionamento para edição completa

**Validações:**
- Aluno deve estar ativo
- Usuário deve ter permissão de professor AEE
- School_id e tenant_id são herdados do perfil do usuário

### **3. Editar Plano (`/edit/:id`)**

**Funcionalidades:**
- ✅ Formulário completo com todas as seções do plano
- ✅ Salvamento progressivo
- ✅ Navegação entre seções
- ✅ Botão para visualizar
- ✅ Edição de campos JSONB (arrays e objetos)

**Seções do Formulário:**
1. Anamnese (Histórico médico, desenvolvimento, família)
2. Diagnóstico (Ferramentas aplicadas)
3. Barreiras de Aprendizagem
4. Queixas (Escola, Família)
5. Recursos e Adaptações
6. Objetivos de Ensino
7. Métodos de Avaliação
8. Acompanhamentos
9. Encaminhamentos
10. Orientações
11. Avaliações Cíclicas (I, II, III)

### **4. Visualizar Plano (`/view/:id`)**

**Funcionalidades:**
- ✅ Visualização somente leitura
- ✅ Layout formatado e organizado
- ✅ Exportação para PDF (futuro)
- ✅ Impressão

### **5. Login (`/login`)**

**Funcionalidades:**
- ✅ Autenticação via Supabase
- ✅ Validação de role (professor AEE)
- ✅ Redirecionamento para dashboard após login

---

## 🔐 Segurança e Permissões (RLS)

### **Políticas de Row Level Security**

#### **1. Professores de AEE - Controle Total**
```sql
CREATE POLICY "aee_teachers_manage_own_plans"
    ON "public"."plano_aee"
    FOR ALL
    USING (
        created_by = auth.uid() 
        OR assigned_aee_teacher_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'aee_teacher'
            AND EXISTS (
                SELECT 1 FROM profiles p
                WHERE p.id = auth.uid()
                AND (p.school_id = plano_aee.school_id
                     OR p.tenant_id = plano_aee.tenant_id)
            )
        )
    );
```

#### **2. Outros Usuários - Apenas Leitura**
```sql
CREATE POLICY "others_view_aee_plans"
    ON "public"."plano_aee"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM students s
            JOIN profiles p ON (
                p.school_id = s.school_id 
                OR p.tenant_id = s.tenant_id
            )
            WHERE s.id = plano_aee.student_id
            AND p.id = auth.uid()
        )
    );
```

#### **3. Comentários - Colaborativos**
- Todos podem comentar em planos que podem visualizar
- Usuários podem editar/deletar apenas seus próprios comentários
- Thread de respostas permitida

#### **4. Anexos**
- Professores de AEE podem gerenciar (upload, delete)
- Outros podem apenas visualizar

---

## 🔗 Integração com PEI

### **Vinculação com PEI**

O Plano de AEE pode ser vinculado a um PEI através do campo `pei_id`:

```typescript
// Criar plano vinculado a um PEI
const { data } = await supabase
  .from('plano_aee')
  .insert({
    pei_id: 'uuid-do-pei',  // Vinculação opcional
    student_id: 'uuid-do-aluno',
    school_id: 'uuid-da-escola',
    tenant_id: 'uuid-do-tenant',
    created_by: userId,
    // ... demais campos
  });
```

### **Aparece como Anexo no PDF do PEI**

Quando um Plano de AEE está vinculado a um PEI, ele aparece automaticamente como **ANEXO A** no relatório PDF do PEI.

**Estrutura do PDF Integrado:**
```
┌─────────────────────────────────────┐
│  PLANO EDUCACIONAL INDIVIDUALIZADO  │
│  (PEI)                              │
│                                     │
│  SEÇÕES DO PEI                      │
│  FEEDBACKS DO PA                    │
│  REUNIÕES                           │
│  AVALIAÇÕES CÍCLICAS                │
├─────────────────────────────────────┤
│  ╔═══════════════════════════════╗  │
│  ║ ANEXO A: PLANO DE AEE         ║  │
│  ╚═══════════════════════════════╝  │
│                                     │
│  A.1 IDENTIFICAÇÃO                  │
│  A.2 ANAMNESE                       │
│  A.3 DIAGNÓSTICO                    │
│  A.4 BARREIRAS IDENTIFICADAS        │
│  A.5 QUEIXAS                        │
│  A.6 RECURSOS E ADAPTAÇÕES          │
│  A.7 OBJETIVOS DE ENSINO            │
│  A.8 MÉTODOS DE AVALIAÇÃO           │
│  A.9 ACOMPANHAMENTOS                │
│  A.10 ENCAMINHAMENTOS               │
│  A.11 ORIENTAÇÕES                   │
│  A.12 AVALIAÇÕES CÍCLICAS DO AEE    │
└─────────────────────────────────────┘
```

**Código de Integração:**
```typescript
// Buscar Plano de AEE vinculado ao PEI
const { data: planoAEE } = await supabase
  .from('plano_aee')
  .select('*')
  .eq('pei_id', peiId)
  .single();

// Incluir no PDF se existir
if (planoAEE) {
  addPlanoAEEAsAnnex(doc, planoAEE);
}
```

Ver documentação completa em: [`docs/integracao/🔗_INTEGRACAO_PEI_PLANO_AEE.md`](../integracao/🔗_INTEGRACAO_PEI_PLANO_AEE.md)

---

## 📊 Máquina de Estados

### **Fluxo de Status do Plano**

```
draft → pending → approved
  ↓         ↓
  ↓    returned
  ↓         ↓
  └─────→ archived
```

| Status | Descrição | Pode Editar? |
|--------|-----------|--------------|
| `draft` | Rascunho inicial | ✅ Sim |
| `pending` | Aguardando aprovação | ⚠️ Limitado |
| `approved` | Aprovado pela coordenação | ❌ Não (apenas visualizar) |
| `returned` | Devolvido para revisão | ✅ Sim |
| `archived` | Arquivado | ❌ Não |

### **Regras de Transição**

- **Draft → Pending**: Professor AEE envia para revisão
- **Pending → Approved**: Coordenador aprova
- **Pending → Returned**: Coordenador solicita alterações
- **Returned → Draft**: Professor edita novamente
- **Approved → Archived**: Fim do ciclo letivo

---

## 🎯 Casos de Uso

### **1. Professor AEE Cria um Novo Plano**

**Fluxo:**
1. Login no app (`/login`)
2. Dashboard (`/`)
3. Clicar em "Novo Plano de AEE"
4. Selecionar aluno
5. Preencher queixas iniciais
6. Salvar e continuar para edição completa
7. Preencher todas as seções do plano
8. Salvar progressivamente
9. Enviar para aprovação (muda status para `pending`)

### **2. Coordenador Revisa o Plano**

**Fluxo:**
1. Recebe notificação de novo plano em revisão
2. Acessa o plano (modo visualização)
3. Adiciona comentários em seções específicas
4. Aprova ou devolve para revisão

### **3. Vinculação com PEI**

**Fluxo:**
1. Professor cria PEI no app principal
2. Professor AEE acessa o PEI
3. Clica em "Criar Plano de AEE para este PEI"
4. Preenche o plano (já vem com `pei_id` preenchido)
5. Ao gerar PDF do PEI, o Plano de AEE aparece como anexo

### **4. Avaliações Cíclicas**

**Fluxo:**
1. Ao final de cada ciclo (Março, Junho, Novembro)
2. Professor AEE acessa o plano
3. Preenche a avaliação do ciclo correspondente:
   - Progresso observado
   - Objetivos alcançados
   - Ajustes necessários
   - Próximos passos
4. Salva a avaliação
5. Badge do ciclo aparece no dashboard

---

## 🔧 Tecnologias Utilizadas

### **Frontend**
- ⚛️ **React 18** com TypeScript
- 🎨 **Tailwind CSS** para estilização
- 🧩 **Componentes**: Biblioteca compartilhada `@pei/ui`
- 🔄 **React Router** para navegação
- 📝 **React Hook Form** para formulários
- ✅ **Zod** para validação

### **Backend**
- 🗄️ **Supabase** (PostgreSQL + Row Level Security)
- 🔐 **Autenticação**: Supabase Auth
- 📦 **Storage**: Supabase Storage (para anexos)

### **Build e Deploy**
- ⚡ **Vite** para build e dev server
- 📦 **PNPM** para gerenciamento de dependências
- 🏗️ **Monorepo**: Turborepo

---

## 📦 Dependências

```json
{
  "dependencies": {
    "@pei/ui": "workspace:*",
    "@pei/database": "workspace:*",
    "@pei/auth": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "react-hook-form": "^7.48.2",
    "@hookform/resolvers": "^3.3.2",
    "@tanstack/react-query": "^5.17.0",
    "zod": "^3.22.4",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.294.0",
    "next-themes": "^0.2.1"
  }
}
```

---

## 🚀 Como Rodar

### **1. Instalação**
```bash
# Na raiz do monorepo
pnpm install
```

### **2. Configuração**
Criar arquivo `.env` em `apps/plano-aee/`:
```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### **3. Desenvolvimento**
```bash
# Rodar todos os apps (recomendado)
pnpm dev

# Ou rodar apenas o app de Plano de AEE
cd apps/plano-aee
pnpm dev
```

**Acesse**: `http://localhost:5175`

### **4. Build de Produção**
```bash
cd apps/plano-aee
pnpm build
```

---

## 🧪 Testes

### **Cenários de Teste**

#### **1. Teste de Criação**
- [ ] Criar plano sem vinculação com PEI
- [ ] Criar plano vinculado a um PEI existente
- [ ] Validar campos obrigatórios
- [ ] Verificar salvamento correto

#### **2. Teste de Permissões**
- [ ] Professor AEE pode criar e editar seus planos
- [ ] Professor AEE não pode editar planos de outras escolas
- [ ] Coordenador pode visualizar e comentar
- [ ] Família não tem acesso

#### **3. Teste de Integração com PEI**
- [ ] Vincular plano a PEI
- [ ] Gerar PDF do PEI com anexo de Plano de AEE
- [ ] Verificar formatação correta no PDF

#### **4. Teste de Ciclos**
- [ ] Preencher avaliação do I Ciclo
- [ ] Preencher avaliação do II Ciclo
- [ ] Preencher avaliação do III Ciclo
- [ ] Verificar exibição de badges no dashboard

---

## 📈 Roadmap

### **Versão Atual (1.0)** ✅
✅ CRUD completo de Planos de AEE  
✅ Sistema de comentários  
✅ Upload de anexos  
✅ Avaliações cíclicas  
✅ Integração com PEI (aparece como anexo no PDF)

**Status**: ✅ Implementado e em Produção

### **Próximas Funcionalidades (1.1)** 🔄
- [ ] Geração de PDF independente do Plano de AEE
- [ ] Histórico de versões do plano
- [ ] Notificações automáticas
- [ ] Relatórios e estatísticas avançadas
- [ ] Exportação para Word/Excel
- [ ] Biblioteca de objetivos de ensino pré-definidos
- [ ] Sugestões de adaptações baseadas em IA

**Previsão**: Q2 2025

### **Visão Futura (2.0)** 🚀

> **📄 Documentação Completa da V2.0**: [`🚀_APP_PLANO_AEE_V2.md`](./🚀_APP_PLANO_AEE_V2.md)

**Principais Novidades**:
- 🆕 **9 novas tabelas** (total de 12)
- 🆕 **Avaliação Diagnóstica** completa (8 áreas)
- 🆕 **Registro de Atendimentos** com frequência
- 🆕 **Metas SMART** gerenciadas
- 🆕 **Geração automática** de 8 tipos de documentos PDF
- 🆕 **Modo Offline** com sincronização
- 🆕 **Dashboard Analítico** com KPIs
- 🆕 **Visitas Escolares** documentadas
- 🆕 **Encaminhamentos** rastreados
- 🆕 **App Mobile** (React Native)

**Previsão**: 18 meses (~Q3 2026)

**Comparação Completa**: Ver [`📋_ROADMAP_PLANO_AEE.md`](./📋_ROADMAP_PLANO_AEE.md)

---

## 🐛 Problemas Conhecidos

### **Limitações Atuais**
- ⚠️ Formulário de edição é longo (considerar paginação)
- ⚠️ Upload de anexos não tem preview
- ⚠️ Sem busca/filtros avançados no dashboard
- ⚠️ PDF gerado apenas via integração com PEI

### **Em Resolução**
- 🔧 Melhorar UX do formulário de edição
- 🔧 Adicionar preview de documentos
- 🔧 Implementar busca por aluno/status

---

## 📞 Suporte

### **Contato**
- **Documentação**: `docs/apps/📚_APP_PLANO_AEE.md`
- **Issues**: Abrir issue no repositório
- **Slack**: Canal `#plano-aee`

### **Links Úteis**
- [Guia Completo do Monorepo](../guias/📚_GUIA_COMPLETO_MONOREPO_V3.md)
- [Integração PEI + Plano AEE](../integracao/🔗_INTEGRACAO_PEI_PLANO_AEE.md)
- [Instalação e Setup](../setup/📦_INSTALACAO_FINAL.md)
- [Migração SQL do Plano de AEE](../../supabase/migrations/20250108000004_plano_aee.sql)

---

## 📝 Changelog

### **[1.0.0] - 2025-01-08**
- ✨ Lançamento inicial do app
- ✨ CRUD completo de Planos de AEE
- ✨ Sistema de comentários colaborativos
- ✨ Upload de anexos
- ✨ Avaliações cíclicas (I, II, III)
- ✨ Integração com PEI (aparece como anexo no PDF)
- ✨ RLS e permissões configuradas

---

## 🎉 Conclusão

O **App de Plano de AEE** é uma ferramenta completa e robusta para professores de AEE criarem e gerenciarem planos detalhados para alunos com necessidades especiais. A integração com o PEI permite criar um documento único e completo, facilitando o acompanhamento e a documentação do processo educacional inclusivo.

**🚀 Próximo Passo**: Explore a [documentação de integração](../integracao/🔗_INTEGRACAO_PEI_PLANO_AEE.md) para implementar a geração de PDF com o Plano de AEE como anexo!

