# Teste de Login com Usuários

## Usuários Disponíveis para Teste

### ✅ Usuários Confirmados no Banco de Dados

Todos os usuários abaixo têm **senha**: `Teste123`

| Email | Nome | Role | Status |
|-------|------|------|--------|
| `coordenador@teste.com` | Maria Coordenadora | coordinator | ✅ Confirmado |
| `gestor.escolar@teste.com` | Carlos Gestor Escolar | school_manager | ✅ Confirmado |
| `diretor.escola@teste.com` | Diretor da Escola | school_director | ✅ Confirmado |
| `professor.aee@teste.com` | Ana Professora AEE | aee_teacher | ✅ Confirmado |
| `professor@teste.com` | João Professor | teacher | ✅ Confirmado |
| `especialista@teste.com` | Dr. Pedro Especialista | specialist | ✅ Confirmado |
| `profissional.apoio@teste.com` | Profissional de Apoio | support_professional | ✅ Confirmado |
| `familia@teste.com` | Pedro Família | family | ✅ Confirmado |
| `secretario.educacao@teste.com` | Secretário de Educação | education_secretary | ✅ Confirmado |

## Como Testar

1. **Acesse**: http://localhost:3000/login
2. **Use as credenciais**:
   - Email: `coordenador@teste.com`
   - Senha: `Teste123`
3. **Após login**, você será redirecionado para `/apps`
4. **Verifique**:
   - ✅ Apenas apps permitidos aparecem
   - ✅ Favoritos funcionam (clique na estrela)
   - ✅ Histórico é registrado ao clicar em apps
   - ✅ Filtros funcionam (Todos, Favoritos, Recentes, Mais Usados)
   - ✅ Animações estão suaves
   - ✅ Seções rápidas aparecem (Favoritos, Mais Usados)

## Apps que Cada Role Pode Acessar

### Coordinator (coordenador@teste.com)
- ✅ PEI Collab
- ✅ Gestão Escolar
- ✅ Plano de AEE
- ✅ Planejamento
- ✅ Blog Educacional
- ✅ Atividades

### School Manager (gestor.escolar@teste.com)
- ✅ PEI Collab
- ✅ Gestão Escolar
- ✅ Plano de AEE
- ✅ Planejamento
- ✅ Blog Educacional
- ✅ Atividades
- ✅ Transporte Escolar
- ✅ Merenda Escolar

### AEE Teacher (professor.aee@teste.com)
- ✅ PEI Collab
- ✅ Plano de AEE
- ✅ Planejamento
- ✅ Blog Educacional
- ✅ Atividades

### Teacher (professor@teste.com)
- ✅ PEI Collab
- ✅ Gestão Escolar
- ✅ Planejamento
- ✅ Blog Educacional
- ✅ Atividades

### Family (familia@teste.com)
- ✅ Portal do Responsável
- ✅ Blog Educacional

### Education Secretary (secretario.educacao@teste.com)
- ✅ Todos os apps (exceto Portal do Responsável)

## Notas Importantes

- ⚠️ Se o login não funcionar, verifique:
  1. Se a senha está correta (`Teste123`)
  2. Se o usuário tem roles na tabela `user_roles`
  3. Se o servidor de desenvolvimento está rodando
  4. Se há erros no console do navegador

- ✅ O usuário `coordenador@teste.com` é o mais recomendado para testes gerais

