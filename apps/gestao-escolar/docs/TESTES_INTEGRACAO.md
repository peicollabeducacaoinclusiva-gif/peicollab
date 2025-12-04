# 🧪 Guia de Testes - Superficha Refatorada

## 📋 Pré-requisitos

1. Banco de dados Supabase rodando
2. Migrações aplicadas
3. Pelo menos um estudante cadastrado no banco

## 🔍 Validação dos Endpoints RPC

### Método 1: Script SQL (Recomendado)

Execute o script SQL no Supabase SQL Editor:

```bash
# Via psql
psql -h localhost -p 54322 -U postgres -d postgres -f scripts/validate-rpc-endpoints.sql

# Ou copie e cole o conteúdo do arquivo no SQL Editor do Supabase
```

O script verificará:
- ✅ Existência das 5 funções RPC
- ✅ Permissões de execução
- ✅ Comentários das funções
- ✅ Resumo geral

### Método 2: Script Node.js

```bash
cd apps/gestao-escolar
node scripts/test-superficha-rpc.js
```

O script:
- Busca um estudante de teste
- Executa todas as funções RPC
- Mostra resultados formatados
- Gera relatório final

## 🚀 Testando a Página Refatorada

### 1. Iniciar o Servidor de Desenvolvimento

```bash
cd apps/gestao-escolar
npm run dev
# ou
pnpm dev
```

### 2. Acessar a Página

1. Faça login no sistema
2. Navegue para a lista de estudantes: `/students`
3. Clique em um estudante para ver o perfil
4. A rota será: `/students/:studentId/profile`

### 3. Verificar Funcionalidades

#### Modo Resumo Inteligente (Padrão)
- [ ] Card principal do estudante carregado
- [ ] Indicadores de risco visíveis
- [ ] Sugestões pedagógicas aparecendo
- [ ] Breadcrumb funcionando

#### Modo Detalhado
- [ ] Alternância entre modos funcionando
- [ ] Tabs navegáveis
- [ ] Formulário consolidado carregando
- [ ] Timeline de atividades visível

#### Edição Incremental
- [ ] Hover mostra botão de editar
- [ ] Edição campo a campo funciona
- [ ] Validação em tempo real
- [ ] Feedback visual de sucesso/erro

## 🔧 Troubleshooting

### Erro: "Function does not exist"

**Causa**: Migração não foi aplicada

**Solução**:
```bash
# Aplicar migração manualmente
supabase migration up
# ou execute o SQL diretamente no banco
```

### Erro: "Permission denied"

**Causa**: Permissões não configuradas

**Solução**:
```sql
-- Verificar e conceder permissões
GRANT EXECUTE ON FUNCTION get_student_complete_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_risk_indicators(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_suggestions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_student_field(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_activity_timeline(uuid, integer) TO authenticated;
```

### Erro: "No student found"

**Causa**: Não há estudantes no banco

**Solução**: Criar pelo menos um estudante via interface ou SQL

### Erro: Loading infinito

**Causa**: Query falhando silenciosamente

**Solução**:
1. Abrir DevTools (F12)
2. Verificar console para erros
3. Verificar Network tab para requisições falhando
4. Verificar se RLS está bloqueando acesso

## 📊 Checklist de Testes

### Funcionalidades Básicas
- [ ] Página carrega sem erros
- [ ] Dados do estudante são exibidos
- [ ] Breadcrumb navegável
- [ ] Alternância de modos funciona

### Indicadores e Risco
- [ ] Indicadores de risco calculados
- [ ] Níveis de risco corretos (Alto/Médio/Baixo)
- [ ] Métricas exibidas corretamente
- [ ] Sugestões pedagógicas aparecem

### Edição
- [ ] Edição incremental funciona
- [ ] Validação de campos
- [ ] Feedback visual de sucesso
- [ ] Dados persistem após edição

### Performance
- [ ] Carregamento inicial < 2s
- [ ] Transições suaves
- [ ] Cache funcionando (não recarrega desnecessariamente)
- [ ] Skeleton loaders aparecem durante carregamento

### Responsividade
- [ ] Layout funciona em desktop
- [ ] Layout funciona em tablet
- [ ] Layout funciona em mobile
- [ ] Navegação touch-friendly

## 🐛 Reportar Problemas

Ao encontrar problemas:

1. **Capturar logs do console**
2. **Capturar Network requests** (DevTools > Network)
3. **Verificar erros no banco** (Supabase Logs)
4. **Documentar steps para reproduzir**
5. **Incluir versão do navegador/OS**

## 📝 Notas

- A versão antiga está disponível em `/students/:studentId/profile/old`
- Todos os testes devem ser executados em ambiente de desenvolvimento primeiro
- Certifique-se de ter dados de teste adequados

---

**Última Atualização**: 27/01/2025

