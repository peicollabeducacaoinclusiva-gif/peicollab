# Especificações Técnicas Complementares - RBAC e Versionamento

## 📋 1. MATRIZ DE PERMISSÕES RBAC DETALHADA

### 1.1 Papéis e Hierarquia

```plaintext
┌─────────────────────────────────────────────────────────────────┐
│                    HIERARQUIA DE PERMISSÕES                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐                                               │
│  │  ADMIN_REDE  │  Acesso total à rede                          │
│  └──────┬───────┘                                               │
│         │                                                       │
│  ┌──────▼─────────────┐                                         │
│  │  GESTOR_ESCOLAR   │  Acesso à escola específica               │
│  └──────┬─────────────┘                                         │
│         │                                                       │
│  ┌──────▼──────────────────────────────┐                        │
│  │  PROFESSOR_REGENTE / PROFESSOR_AEE │  Acesso aos seus alunos │
│  └──────┬──────────────────────────────┘                        │
│         │                                                       │
│  ┌──────▼───────┐                                               │
│  │    FAMÍLIA   │  Acesso apenas aos seus filhos                │
│  └──────────────┘                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Tabela de Permissões por Recurso

#### A. GERENCIAMENTO DE REDE (networks)

| Ação                       | ADMIN_REDE | GESTOR_ESCOLAR | PROFESSOR | FAMÍLIA |
| -------------------------- | ---------- | -------------- | --------- | ------- |
| Visualizar rede própria    | ✅         | ✅             | ✅        | ✅      |
| Editar dados da rede       | ✅         | ❌             | ❌        | ❌      |
| Gerenciar escolas          | ✅         | ❌             | ❌        | ❌      |
| Gerenciar usuários da rede | ✅         | ❌             | ❌        | ❌      |
| Ver analytics da rede      | ✅         | ❌             | ❌        | ❌      |

#### B. GERENCIAMENTO DE ESCOLA (schools)

| Ação                         | ADMIN_REDE | GESTOR_ESCOLAR  | PROFESSOR        | FAMÍLIA |
| ---------------------------- | ---------- | --------------- | ---------------- | ------- |
| Visualizar escola própria    | ✅         | ✅              | ✅               | ✅      |
| Editar escola                | ✅         | ✅ (sua escola) | ❌               | ❌      |
| Gerenciar usuários da escola | ✅         | ✅ (sua escola) | ❌               | ❌      |
| Ver alunos da escola         | ✅         | ✅ (sua escola) | ✅ (seus alunos) | ❌      |
| Ver analytics da escola      | ✅         | ✅              | ❌               | ❌      |

#### C. GERENCIAMENTO DE ESTUDANTES (students)

| Ação                     | ADMIN_REDE | GESTOR_ESCOLAR  | PROFESSOR        | FAMÍLIA          |
| ------------------------ | ---------- | --------------- | ---------------- | ---------------- |
| Listar estudantes        | ✅ (todos) | ✅ (sua escola) | ✅ (seus alunos) | ✅ (seus filhos) |
| Criar estudante          | ✅         | ✅              | ❌               | ❌               |
| Editar estudante         | ✅         | ✅              | ❌               | ❌               |
| Visualizar detalhes      | ✅         | ✅              | ✅               | ✅ (seus filhos) |
| Inativar estudante       | ✅         | ✅              | ❌               | ❌               |
| Transferir entre escolas | ✅         | ❌              | ❌               | ❌               |

#### D. TEMPLATES (document_templates)

| Ação                      | ADMIN_REDE | GESTOR_ESCOLAR | PROFESSOR | FAMÍLIA |
| ------------------------- | ---------- | -------------- | --------- | ------- |
| Listar templates          | ✅         | ✅             | ✅        | ❌      |
| Criar template            | ✅         | ❌             | ❌        | ❌      |
| Editar template           | ✅         | ❌             | ❌        | ❌      |
| Ativar/Desativar template | ✅         | ❌             | ❌        | ❌      |
| Usar template             | ✅         | ✅             | ✅        | ❌      |

#### E. DOCUMENTOS (documents)

| Ação                      | ADMIN_REDE | GESTOR_ESCOLAR | PROFESSOR           | FAMÍLIA          |
| ------------------------- | ---------- | -------------- | ------------------- | ---------------- |
| **Status: RASCUNHO**      |            |                |                     |                  |
| Criar documento           | ✅         | ✅             | ✅                  | ❌               |
| Visualizar                | ✅         | ✅             | ✅ (seus docs)      | ✅ (seus filhos) |
| Editar                    | ✅         | ✅             | ✅ (autor)          | ❌               |
| Excluir                   | ✅         | ✅             | ✅ (autor)          | ❌               |
| Enviar para validação     | ✅         | ✅             | ✅ (autor)          | ❌               |
| **Status : EM_VALIDAÇÃO** |            |                |                     |                  |
| Visualizar                | ✅         | ✅             | ✅                  | ✅ (seus filhos) |
| Editar                    | ❌         | ❌             | ❌                  | ❌               |
| Aprovar/Rejeitar          | ✅         | ✅ (escola)    | ❌                  | ❌               |
| Adicionar comentário      | ✅         | ✅             | ✅                  | ✅               |
| **Status: APROVADO**      |            |                |                     |                  |
| Visualizar                | ✅         | ✅             | ✅                  | ✅               |
| Criar nova versão         | ✅         | ✅             | ✅ (autor original) | ❌               |
| Editar (nova versão)      | ✅         | ✅             | ✅ (autor)          | ❌               |
| Arquivar                  | ✅         | ✅             | ❌                  | ❌               |
| **Status: ARQUIVADO**     |            |                |                     |                  |
| Visualizar                | ✅         | ✅             | ✅                  | ✅               |
| Reativar                  | ✅         | ✅             | ❌                  | ❌               |

#### F. METAS (goals)

| Ação                      | ADMIN_REDE | GESTOR_ESCOLAR | PROFESSOR                      | FAMÍLIA          |
| ------------------------- | ---------- | -------------- | ------------------------------ | ---------------- |
| Listar metas do estudante | ✅         | ✅             | ✅                             | ✅ (seus filhos) |
| Criar meta                | ✅         | ✅             | ✅                             | ❌               |
| Editar meta               | ✅         | ✅             | ✅ (criador)                   | ❌               |
| Excluir meta              | ✅         | ✅             | ✅ (criador, se não vinculada) | ❌               |
| Atualizar progresso       | ✅         | ✅             | ✅ (responsável)               | ❌               |
| Visualizar progresso      | ✅         | ✅             | ✅                             | ✅               |
| Vincular ao PEI           | ✅         | ✅             | ✅                             | ❌               |
| Desvincular do PEI        | ✅         | ✅             | ✅                             | ❌               |

#### G. PARTICIPAÇÃO DA FAMÍLIA

| Ação                       | ADMIN_REDE | GESTOR_ESCOLAR | PROFESSOR | FAMÍLIA          |
| -------------------------- | ---------- | -------------- | --------- | ---------------- |
| Comentar documento         | ❌         | ❌             | ❌        | ✅ (seus filhos) |
| Visualizar comentários     | ✅         | ✅             | ✅        | ✅ (seus filhos) |
| Dar ciência (ack)          | ❌         | ❌             | ❌        | ✅ (seus filhos) |
| Remover próprio comentário | ❌         | ❌             | ❌        | ✅ (próprio)     |

#### H. VALIDAÇÕES E AUDITORIA

| Ação                  | ADMIN_REDE | GESTOR_ESCOLAR    | PROFESSOR | FAMÍLIA |
| --------------------- | ---------- | ----------------- | --------- | ------- |
| Validar documento     | ✅         | ✅ (nível escola) | ❌        | ❌      |
| Ver validações        | ✅         | ✅                | ✅        | ✅      |
| Ver logs de auditoria | ✅         | ❌                | ❌        | ❌      |
| Exportar relatórios   | ✅         | ✅                | ❌        | ❌      |

### 1.3 Regras de Escopo de Dados (Data Scoping)

```sql
-- Exemplo de RLS (Row Level Security) no Supabase

-- Networks: Cada usuário vê apenas sua rede
CREATE POLICY network_isolation ON networks
  FOR ALL
  USING (id = current_setting('app.current_network_id')::uuid);

-- Schools: Gestores veem sua escola, admins veem todas da rede
CREATE POLICY school_isolation ON schools
  FOR SELECT
  USING (
    network_id = current_setting('app.current_network_id')::uuid
    AND (
      current_setting('app.current_user_role') = 'admin_rede'
      OR id = current_setting('app.current_school_id')::uuid
    )
  );

-- Documents: Professores veem apenas seus documentos
CREATE POLICY document_isolation ON documents
  FOR ALL
  USING (
    network_id = current_setting('app.current_network_id')::uuid
    AND (
      current_setting('app.current_user_role') IN ('admin_rede', 'gestor_escolar')
      OR criado_por = current_setting('app.current_user_id')::uuid
    )
  );
```

### 1.4 Middleware de Autorização (Pseudocódigo)

```typescript
// Exemplo de implementação de middleware de autorização

interface PermissionCheck {
  resource: string;
  action: string;
  resourceId?: string;
}

async function authorize(
  user: User,
  check: PermissionCheck
): Promise<boolean> {
  // 1. Verificar papel do usuário
  const userRole = user.role;

  // 2. Verificar se o papel tem permissão para a ação
  const permissionMatrix = {
    'documents:edit': ['admin_rede', 'gestor_escolar'],
    'documents:create': ['admin_rede', 'gestor_escolar', 'professor_regente', 'professor_aee'],
    'goals:create': ['admin_rede', 'gestor_escolar', 'professor_regente', 'professor_aee'],
    'family:comment': ['familia'],
    // ... outras permissões
  };

  const allowedRoles = permissionMatrix[`${check.resource}:${check.action}`];
  if (!allowedRoles.includes(userRole)) {
    return false;
  }

  // 3. Verificar escopo (ownership)
  if (check.resourceId) {
    const resource = await fetchResource(check.resource, check.resourceId);

    // Admin rede: acesso a tudo da rede
    if (userRole === 'admin_rede') {
      return resource.network_id === user.network_id;
    }

    // Gestor escolar: acesso à sua escola
    if (userRole === 'gestor_escolar') {
      return resource.school_id === user.school_id;
    }

    // Professor: acesso aos seus documentos/alunos
    if (['professor_regente', 'professor_aee'].includes(userRole)) {
      if (check.resource === 'documents') {
        return resource.criado_por === user.id;
      }
      if (check.resource === 'students') {
        return await isProfessorOfStudent(user.id, resource.id);
      }
    }

    // Família: acesso apenas aos seus filhos
    if (userRole === 'familia') {
      if (check.resource === 'students') {
        return await isParentOfStudent(user.id, resource.id);
      }
    }
  }

  return true;
}
</boolean>
```

---

## 🔄 2. FLUXO DE VERSIONAMENTO DE DOCUMENTOS

### 2.1 Estratégia de Versionamento : Snapshot Semântico

O sistema adota uma estratégia híbrida que equilibra simplicidade com rastreabilidade :

```plaintext
┌─────────────────────────────────────────────────────────────────────┐
│              ESTRATÉGIA: SNAPSHOT SEMÂNTICO                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  • Versões são criadas APENAS quando um documento APROVADO          │
│    precisa ser editado                                              │
│                                                                     │
│  • Documentos em RASCUNHO não geram versionamento                   │
│                                                                     │
│  • Cada versão é um snapshot completo do documento                  │
│                                                                     │
│  • Metas vinculadas são COPIADAS (não movidas) para nova versão     │
│                                                                     │
│  • Versão anterior é ARQUIVADA (não excluída)                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Diagrama de Estados do Documento

```plaintext
                              ┌─────────────┐
                              │   CRIADO    │
                              │  (rascunho) │
                              └──────┬──────┘
                                     │
                      ┌──────────────┼──────────────┐
                      │              │              │
                      ▼              │              ▼
              ┌──────────────┐       │      ┌──────────────┐
              │  EM EDIÇÃO   │       │      │  ENVIADO     │
              │  (rascunho)  │◄──────┘      │  p/ validação│
              └──────┬───────┘              └──────┬───────┘
                     │                            │
                     │ (autor decide enviar)       │
                     └────────────────────────────┘
                                                  │
                                                  ▼
                    ┌─────────────────────────────────────────┐
                    │             EM VALIDAÇÃO                │
                    │  (não editável, aguardando aprovação)   │
                    └─────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               │               ▼
            ┌──────────────┐        │       ┌──────────────┐
            │  REJEITADO   │        │       │   APROVADO   │
            │  (com notas) │◄───────┘       └──────┬───────┘
            └──────┬───────┘                       │
                   │                               │
                   │ (retorna a rascunho)          │ (pode ser editado)
                   │                               ▼
                   │                       ┌──────────────┐
                   └──────────────────────►│ NOVA VERSÃO  │
                                           │  criada      │
                                           └──────┬───────┘
                                                  │
                                                  ▼
                                           ┌──────────────┐
                                           │  VERSÃO N    │
                                           │  (rascunho)  │
                                           └──────────────┘
                                                  │
                                                  ▼
                                           ┌──────────────┐
                                           │  VERSÃO N-1  │
                                           │  (arquivada) │
                                           └──────────────┘
```

### 2.3 Fluxo de Criação de Nova Versão

```plaintext
┌────────────────────────────────────────────────────────────────────┐
│           FLUXO: CRIAR NOVA VERSÃO DE DOCUMENTO APROVADO           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. USUÁRIO clica em "Criar Nova Versão"                           │
│                                                                    │
│  2. SISTEMA valida:                                                │
│     ✓ Usuário tem permissão                                        │
│     ✓ Documento está APROVADO                                      │
│     ✓ Usuário é autor original OU tem papel adequado               │
│                                                                    │
│  3. SISTEMA executa em transação:                                  │
│                                                                    │
│     a) Cria NOVO registro em documents:                            │
│        • student_id = original.student_id                          │
│        • template_id = original.template_id                        │
│        • tipo = original.tipo                                      │
│        • status = 'rascunho'                                       │
│        • versao = original.versao + 1                              │
│        • versao_pai_id = original.id (referência)                  │
│        • criado_por = usuário atual                                │
│                                                                    │
│     b) Copia document_field_values:                                │
│        • Para cada campo da versão anterior                        │
│        • Cria novo registro apontando para novo document_id        │
│        • Mantém os valores                                         │
│                                                                    │
│     c) Copia metas vinculadas (via goal_links):                    │
│        • Para cada meta vinculada ao documento anterior            │
│        • Cria novo registro em goal_links                          │
│        • Aponta para o novo document_id                            │
│        • Meta original permanece inalterada                        │
│                                                                    │
│     d) Arquiva versão anterior:                                    │
│        • UPDATE documents SET status = 'arquivado'                 │
│        • WHERE id = original.id                                    │
│                                                                    │
│     e) Registra em audit_logs:                                     │
│        • entidade = 'document'                                     │
│        • acao = 'version_created'                                  │
│        • entidade_id = novo_document_id                            │
│        • before_json = {original_id: ..., versao: ...}             │
│        • after_json = {novo_id: ..., nova_versao: ...}             │
│                                                                    │
│  4. SISTEMA retorna novo_document_id                               │
│                                                                    │
│  5. USUÁRIO é redirecionado para edição da nova versão             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 2.4 Schema de Banco Atualizado (Campos de Versionamento)

```sql
-- Tabela documents com campos de versionamento
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network_id UUID NOT NULL REFERENCES networks(id),
    student_id UUID NOT NULL REFERENCES students(id),
    template_id UUID NOT NULL REFERENCES document_templates(id),

    -- Tipo e Status
    tipo DOCUMENT_TYPE NOT NULL, -- enum: estudo_caso, paee, pei
    status DOCUMENT_STATUS NOT NULL DEFAULT 'rascunho',
    -- enum: rascunho, em_validacao, aprovado, arquivado

    -- VERSIONAMENTO
    versao INTEGER NOT NULL DEFAULT 1,
    versao_pai_id UUID REFERENCES documents(id), -- self-reference
    is_versao_atual BOOLEAN NOT NULL DEFAULT true,

    -- Metadados
    criado_por UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Quando foi aprovado (útil para relatórios)
    aprovado_em TIMESTAMP WITH TIME ZONE,
    aprovado_por UUID REFERENCES users(id),

    -- Controle de versão do template usado
    template_versao INTEGER NOT NULL DEFAULT 1
);

-- Índices importantes para versionamento
CREATE INDEX idx_documents_student_versao_atual
ON documents(student_id, is_versao_atual)
WHERE is_versao_atual = true;

CREATE INDEX idx_documents_versao_pai
ON documents(versao_pai_id);

CREATE INDEX idx_documents_network_status
ON documents(network_id, status);

-- Trigger para garantir apenas uma versão atual por documento
CREATE OR REPLACE FUNCTION enforce_single_current_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_versao_atual = true THEN
        UPDATE documents
        SET is_versao_atual = false
        WHERE student_id = NEW.student_id
        AND tipo = NEW.tipo
        AND id != NEW.id
        AND is_versao_atual = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_current_version
AFTER INSERT OR UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION enforce_single_current_version();
```

### 2.5 API - Endpoints de Versionamento

```typescript
// Interface de Documento com Versionamento
interface Document {
  id: string;
  network_id: string;
  student_id: string;
  template_id: string;
  tipo: 'estudo_caso' | 'paee' | 'pei';
  status: 'rascunho' | 'em_validacao' | 'aprovado' | 'arquivado';
  versao: number;
  versao_pai_id?: string;  // ID da versão anterior
  is_versao_atual: boolean;
  criado_por: string;
  created_at: string;
  updated_at: string;
  aprovado_em?: string;
  aprovado_por?: string;
}

// Resposta da API de histórico
interface DocumentVersionHistory {
  documento_atual: Document;
  historico: {
    id: string;
    versao: number;
    status: string;
    criado_por: {
      id: string;
      name: string;
    };
    created_at: string;
    aprovado_em?: string;
    metas_vinculadas_count: number;
  }[];
  pode_criar_nova_versao: boolean;
  motivo_bloqueio?: string;  // Se não puder criar nova versão
}

// ==================== ENDPOINTS ====================

/**
 * GET /api/documents/:id/versions
 * Retorna histórico de versões de um documento
 * Requer: permissão de leitura do documento
 */
async function getDocumentVersions(documentId: string): Promise<documentversionhistory> {
  // Buscar documento atual
  const currentDoc = await db.documents.findById(documentId);

  // Buscar todas as versões do mesmo "linha" de documento
  // (mesmo student_id, mesmo tipo)
  const allVersions = await db.documents.findMany({
    where: {
      student_id: currentDoc.student_id,
      tipo: currentDoc.tipo,
    },
    orderBy: { versao: 'desc' },
    include: {
      criado_por: { select: { id: true, name: true } },
      _count: { select: { goal_links: true } }
    }
  });

  // Verificar se pode criar nova versão
  const canCreateNew = currentDoc.status === 'aprovado' &&
    ['admin_rede', 'gestor_escolar'].includes(currentUser.role);

  return {
    documento_atual: currentDoc,
    historico: allVersions.map(v => ({
      id: v.id,
      versao: v.versao,
      status: v.status,
      criado_por: v.criado_por,
      created_at: v.created_at,
      aprovado_em: v.aprovado_em,
      metas_vinculadas_count: v._count.goal_links
    })),
    pode_criar_nova_versao: canCreateNew,
    motivo_bloqueio: canCreateNew ? undefined :
      currentDoc.status !== 'aprovado' ? 'Documento precisa estar aprovado' :
      'Permissão insuficiente'
  };
}

/**
 * POST /api/documents/:id/versions
 * Cria nova versão de um documento aprovado
 * Requer: documento aprovado + permissão de edição
 */
async function createNewVersion(documentId: string): Promise<document> {
  return await db.transaction(async (trx) => {
    // 1. Buscar documento original
    const original = await trx.documents.findById(documentId);

    // 2. Validações
    if (original.status !== 'aprovado') {
      throw new Error('Apenas documentos aprovados podem ter nova versão');
    }

    if (!await authorize(currentUser, {
      resource: 'documents',
      action: 'create_version',
      resourceId: documentId
    })) {
      throw new Error('Permissão negada');
    }

    // 3. Criar novo documento
    const newVersion = await trx.documents.create({
      data: {
        network_id: original.network_id,
        student_id: original.student_id,
        template_id: original.template_id,
        tipo: original.tipo,
        status: 'rascunho',
        versao: original.versao + 1,
        versao_pai_id: original.id,
        is_versao_atual: true,
        criado_por: currentUser.id,
        template_versao: original.template_versao
      }
    });

    // 4. Copiar valores dos campos
    const fieldValues = await trx.document_field_values.findMany({
      where: { document_id: original.id }
    });

    await trx.document_field_values.createMany({
      data: fieldValues.map(fv => ({
        document_id: newVersion.id,
        field_id: fv.field_id,
        value_text: fv.value_text,
        value_json: fv.value_json
      }))
    });

    // 5. Copiar vínculos de metas
    const goalLinks = await trx.goal_links.findMany({
      where: { linked_document_id: original.id }
    });

    await trx.goal_links.createMany({
      data: goalLinks.map(gl => ({
        goal_id: gl.goal_id,
        linked_document_id: newVersion.id,
        tipo_vinculo: gl.tipo_vinculo
      }))
    });

    // 6. Arquivar versão anterior
    await trx.documents.update({
      where: { id: original.id },
      data: {
        status: 'arquivado',
        is_versao_atual: false,
        updated_at: new Date()
      }
    });

    // 7. Registrar auditoria
    await trx.audit_logs.create({
      data: {
        entidade: 'document',
        entidade_id: newVersion.id,
        acao: 'version_created',
        user_id: currentUser.id,
        before_json: JSON.stringify({
          original_id: original.id,
          versao: original.versao,
          status: original.status
        }),
        after_json: JSON.stringify({
          novo_id: newVersion.id,
          nova_versao: newVersion.versao,
          status: newVersion.status,
          versao_pai_id: original.id
        })
      }
    });

    return newVersion;
  });
}

/**
 * GET /api/documents/:id/versions/:versionId
 * Retorna uma versão específica (para visualização histórica)
 * Requer: permissão de leitura
 */
async function getSpecificVersion(
  documentId: string,
  versionId: string
): Promise<document &="" {="" campos:="" fieldvalue[],="" metas:="" goal[]="" }=""> {
  // Validação de permissão
  if (!await authorize(currentUser, {
    resource: 'documents',
    action: 'read',
    resourceId: documentId
  })) {
    throw new Error('Permissão negada');
  }

  // Buscar versão específica
  const version = await db.documents.findFirst({
    where: {
      id: versionId,
      OR: [
        { id: documentId },
        { versao_pai_id: documentId }
      ]
    },
    include: {
      field_values: true,
      goal_links: {
        include: { goal: true }
      }
    }
  });

  if (!version) {
    throw new Error('Versão não encontrada');
  }

  return {
    ...version,
    campos: version.field_values,
    metas: version.goal_links.map(gl => gl.goal)
  };
}
</document></document></documentversionhistory>
```

### 2.6 Comportamento de Metas em Versionamento

```plaintext
┌────────────────────────────────────────────────────────────────────┐
│           COMPORTAMENTO DE METAS NO VERSIONAMENTO                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  CENÁRIO 1: Meta criada no PAEE v1, vinculada ao PEI v1           │
│  ─────────────────────────────────────────────────────────────     │
│                                                                    │
│  PAEE v1 (APROVADO)         PEI v1 (APROVADO)                     │
│  ┌──────────────┐           ┌──────────────┐                      │
│  │ Meta "X"     │◄──────────│ goal_links   │                      │
│  │              │           │              │                      │
│  └──────────────┘           └──────────────┘                      │
│                                                                    │
│  Quando criar PEI v2:                                              │
│                                                                    │
│  PAEE v1 (ARQUIVADO)        PEI v1 (ARQUIVADO)  PEI v2 (RASCUNHO) │
│  ┌──────────────┐           ┌──────────────┐    ┌──────────────┐  │
│  │ Meta "X"     │◄──────────│ goal_links   │    │ goal_links   │  │
│  │              │           │ (mantido)    │    │ (NOVO -      │  │
│  └──────────────┘           └──────────────┘    │ copiado)     │  │
│                                                 │ aponta para  │  │
│                                                 │ mesma Meta X │  │
│                                                 └──────────────┘  │
│                                                                    │
│  IMPORTANTE: A meta NÃO é duplicada, apenas o vínculo (goal_link)  │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  CENÁRIO 2: Editar meta em nova versão do PAEE                    │
│  ─────────────────────────────────────────────────────────────     │
│                                                                    │
│  PAEE v1 (ARQUIVADO)        PAEE v2 (RASCUNHO)                    │
│  ┌──────────────┐           ┌──────────────┐                      │
│  │ Meta "X"     │           │ Meta "X'"    │  ← NOVA meta        │
│  │ desc: "..."  │           │ desc: "alt"  │  (cópia editável)   │
│  └──────────────┘           └──────────────┘                      │
│                                                                    │
│  PEI v1 continua vinculado à Meta "X" (ARQUIVADA)                  │
│  PEI v2 pode ser vinculado à Meta "X'"                             │
│                                                                    │
│  Isso preserva o histórico do PEI v1 enquanto permite              │
│  evolução no PAEE v2                                               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 2.7 Interface do Usuário - Versionamento

```plaintext
┌────────────────────────────────────────────────────────────────────┐
│  DOCUMENTO: PEI - João Silva                      [+ Nova Versão]  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ╔══════════════════════════════════════════════════════════════╗  │
│  ║  📋 HISTÓRICO DE VERSÕES                                    ║  │
│  ╠══════════════════════════════════════════════════════════════╣  │
│  ║                                                              ║  │
│  ║  ● Versão 3 (ATUAL) - Rascunho                              ║  │
│  ║    Criada em: 20/02/2025 por: Prof. Maria                   ║  │
│  ║    Status: Em edição                                        ║  │
│  ║    Metas vinculadas: 5                                      ║  │
│  ║    [Ver] [Editar]                                           ║  │
│  ║                                                              ║  │
│  ║  ○ Versão 2 - Arquivada                                     ║  │
│  ║    Criada em: 15/01/2025 por: Prof. Maria                   ║  │
│  ║    Aprovada em: 20/01/2025 por: Gestor Escolar              ║  │
│  ║    Status: Arquivada (substituída pela v3)                  ║  │
│  ║    Metas vinculadas: 4                                      ║  │
│  ║    [Ver versão] [Comparar com atual]                        ║  │
│  ║                                                              ║  │
│  ║  ○ Versão 1 - Arquivada                                     ║  │
│  ║    Criada em: 10/03/2024 por: Prof. Ana                     ║  │
│  ║    Aprovada em: 15/03/2024 por: Gestor Escolar              ║  │
│  ║    Status: Arquivada                                        ║  │
│  ║    Metas vinculadas: 3                                      ║  │
│  ║    [Ver versão] [Comparar com atual]                        ║  │
│  ║                                                              ║  │
│  ╚══════════════════════════════════════════════════════════════╝  │
│                                                                    │
│  ℹ️ Informações:                                                   │
│  • Apenas documentos APROVADOS podem ter nova versão criada       │
│  • Versões arquivadas são mantidas para histórico                 │
│  • Metas são copiadas para novas versões                          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ 3. REGRAS DE NEGÓCIO ADICIONAIS

### 3.1 Validações de Estado

```typescript
// Regras de transição de estado
const stateMachineRules = {
  rascunho: ['em_validacao', 'excluido'],
  em_validacao: ['aprovado', 'rejeitado', 'rascunho'],
  aprovado: ['arquivado'], // Nova versão cria novo documento
  arquivado: ['aprovado'], // Reativação (raro)
  rejeitado: ['rascunho'],
};

// Validações antes de ações
const actionValidations = {
  create_version: {
    requiredStatus: ['aprovado'],
    requiredRoles: ['admin_rede', 'gestor_escolar', 'professor_regente', 'professor_aee'],
    additionalCheck: async (doc, user) => {
      // Apenas autor original ou gestores podem versionar
      return doc.criado_por === user.id || ['admin_rede', 'gestor_escolar'].includes(user.role);
    },
  },
  submit_for_validation: {
    requiredStatus: ['rascunho'],
    requiredRoles: ['professor_regente', 'professor_aee', 'gestor_escolar', 'admin_rede'],
    additionalCheck: async (doc, user) => {
      // Verificar se documento tem campos obrigatórios preenchidos
      return await hasRequiredFieldsFilled(doc.id);
    },
  },
  approve: {
    requiredStatus: ['em_validacao'],
    requiredRoles: ['gestor_escolar', 'admin_rede'],
    additionalCheck: async (doc, user) => {
      // Gestor só pode aprovar da própria escola
      if (user.role === 'gestor_escolar') {
        return doc.school_id === user.school_id;
      }
      return true;
    },
  },
};
```

### 3.2 Notificações por Evento

| Evento                           | Destinatários        | Canal          | Conteúdo                                              |
| -------------------------------- | -------------------- | -------------- | ----------------------------------------------------- |
| Documento enviado para validação | Gestor Escolar       | In-app + Email | "[Professor] enviou [Tipo] de [Aluno] para validação" |
| Documento aprovado               | Professor autor      | In-app         | "Seu [Tipo] foi aprovado"                             |
| Documento rejeitado              | Professor autor      | In-app + Email | "[Tipo] rejeitado: [motivo]"                          |
| Nova versão criada               | Gestor Escolar       | In-app         | "Nova versão de [Tipo] criada para [Aluno]"           |
| Comentário da família            | Professor + Gestor   | In-app         | "Família comentou em [Tipo]"                          |
| Meta próxima do prazo            | Responsável          | In-app + Email | "Meta '[Descrição]' vence em [X] dias"                |
| Meta atrasada                    | Responsável + Gestor | In-app + Email | "Meta '[Descrição]' está atrasada"                    |

---

## 📊 4. MÉTRICAS E INDICADORES (Analytics)

### 4.1 Views Materializadas Sugeridas

```sql
-- View: Documentos ativos por escola
CREATE MATERIALIZED VIEW mv_documentos_ativos AS
SELECT
    s.school_id,
    s.network_id,
    d.tipo,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE d.status = 'aprovado' AND d.is_versao_atual) as ativos,
    COUNT(*) FILTER (WHERE d.status = 'em_validacao') as pendentes,
    COUNT(*) FILTER (WHERE d.status = 'rascunho') as em_edicao
FROM documents d
JOIN students s ON d.student_id = s.id
WHERE d.is_versao_atual = true
GROUP BY s.school_id, s.network_id, d.tipo;

-- View: Metas em atraso
CREATE MATERIALIZED VIEW mv_metas_atrasadas AS
SELECT
    g.id as goal_id,
    g.student_id,
    s.school_id,
    g.descricao,
    g.prazo,
    g.responsavel_user_id,
    DATE_PART('day', NOW() - g.prazo) as dias_atraso
FROM goals g
JOIN students s ON g.student_id = s.id
WHERE g.status = 'ativa'
AND g.prazo < NOW();

-- View: Tempo médio de aprovação
CREATE MATERIALIZED VIEW mv_tempo_aprovacao AS
SELECT
    network_id,
    tipo,
    AVG(aprovado_em - created_at) as tempo_medio,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY aprovado_em - created_at) as mediana
FROM documents
WHERE status = 'aprovado'
AND aprovado_em IS NOT NULL
GROUP BY network_id, tipo;

-- Refresh automático diário
CREATE OR REPLACE FUNCTION refresh_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_documentos_ativos;
    REFRESH MATERIALIZED VIEW mv_metas_atrasadas;
    REFRESH MATERIALIZED VIEW mv_tempo_aprovacao;
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ 5. CHECKLIST DE IMPLEMENTAÇÃO

### Sprint 1 : Fundação

- [ ] Configurar RLS no Supabase

- [ ] Implementar middleware de autorização

- [ ] Criar função helper `authorize()`

- [ ] Testar isolamento entre redes

### Sprint 2: Templates e Estudantes

- [ ] Implementar verificações de permissão em students

- [ ] Restringir criação de estudantes por papel

- [ ] Proteger endpoints de templates (apenas admin_rede)

### Sprint 3: PAEE e Metas

- [ ] Implementar criação de metas com verificação de responsável

- [ ] Restringir edição de metas ao criador

- [ ] Validar escopo de dados em todas as queries

### Sprint 4: PEI e Família

- [ ] Implementar permissões específicas para família

- [ ] Criar endpoints restritos para comentários

- [ ] Validar ciência apenas por família

### Sprint 5 : Validação e Logs

- [ ] Implementar máquina de estados com validações

- [ ] Criar fluxo de aprovação com notificações

- [ ] Garantir que apenas gestores aprovem

### Sprint 6: Versionamento

- [ ] Implementar endpoint de nova versão

- [ ] Criar lógica de cópia de campos

- [ ] Implementar cópia de metas vinculadas

- [ ] Criar interface de histórico

- [ ] Testar cenários de versionamento

---

## 📝 6. EXEMPLOS DE TESTES

```typescript
// Testes de integração para RBAC
describe('RBAC - Documentos', () => {

  test('professor não pode editar documento de outro professor', async () => {
    const doc = await createDocument({ criado_por: professorA.id });

    const result = await request(app)
      .put(`/api/documents/${doc.id}`)
      .set('Authorization', `Bearer ${professorB.token}`)
      .send({ campo: 'valor' });

    expect(result.status).toBe(403);
  });

  test('gestor pode editar documento de professor de sua escola', async () => {
    const doc = await createDocument({
      criado_por: professor.id,
      school_id: gestor.school_id
    });

    const result = await request(app)
      .put(`/api/documents/${doc.id}`)
      .set('Authorization', `Bearer ${gestor.token}`)
      .send({ campo: 'valor' });

    expect(result.status).toBe(200);
  });

  test('família pode apenas comentar, não editar', async () => {
    const doc = await createDocument({ student_id: filhoDaFamilia.id });

    // Tentar editar
    const editResult = await request(app)
      .put(`/api/documents/${doc.id}`)
      .set('Authorization', `Bearer ${familia.token}`)
      .send({ campo: 'valor' });

    expect(editResult.status).toBe(403);

    // Comentar deve funcionar
    const commentResult = await request(app)
      .post(`/api/documents/${doc.id}/comments`)
      .set('Authorization', `Bearer ${familia.token}`)
      .send({ comentario: 'Ótimo trabalho!' });

    expect(commentResult.status).toBe(201);
  });
});

// Testes de versionamento
describe('Versionamento de Documentos', () => {

  test('apenas documentos aprovados podem ter nova versão', async () => {
    const docRascunho = await createDocument({ status: 'rascunho' });

    const result = await request(app)
      .post(`/api/documents/${docRascunho.id}/versions`)
      .set('Authorization', `Bearer ${professor.token}`);

    expect(result.status).toBe(400);
    expect(result.body.error).toContain('aprovados');
  });

  test('nova versão copia campos e metas', async () => {
    const docAprovado = await createDocument({
      status: 'aprovado',
      criado_por: professor.id
    });

    // Adicionar campos e metas
    await addFieldValues(docAprovado.id, [...]);
    await linkGoals(docAprovado.id, [goal1.id, goal2.id]);

    // Criar nova versão
    const result = await request(app)
      .post(`/api/documents/${docAprovado.id}/versions`)
      .set('Authorization', `Bearer ${professor.token}`);

    expect(result.status).toBe(201);

    // Verificar cópia
    const novoDoc = result.body;
    expect(novoDoc.versao).toBe(2);
    expect(novoDoc.versao_pai_id).toBe(docAprovado.id);
    expect(novoDoc.status).toBe('rascunho');

    // Verificar campos copiados
    const campos = await getFieldValues(novoDoc.id);
    expect(campos.length).toBeGreaterThan(0);

    // Verificar metas copiadas
    const metas = await getLinkedGoals(novoDoc.id);
    expect(metas.length).toBe(2);

    // Verificar versão anterior arquivada
    const docAntigo = await getDocument(docAprovado.id);
    expect(docAntigo.status).toBe('arquivado');
    expect(docAntigo.is_versao_atual).toBe(false);
  });

  test('versão arquivada não pode ser editada', async () => {
    const docArquivado = await createDocument({ status: 'arquivado' });

    const result = await request(app)
      .put(`/api/documents/${docArquivado.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ campo: 'valor' });

    expect(result.status).toBe(403);
  });
});
```

---

**Documento elaborado como complemento ao Plano de Requisitos original.**
