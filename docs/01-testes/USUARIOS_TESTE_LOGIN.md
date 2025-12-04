# Usuários de Teste para Login

## Credenciais Padrão

**Senha padrão para todos os usuários**: `Teste123`

> ⚠️ **Nota**: Alguns usuários podem ter senha `Teste123!` (com exclamação). Tente ambas se necessário.

## Usuários Disponíveis no Banco

### Usuários Principais (Confirmados no Banco)

| Email | Nome | Role(s) | Senha | Acesso aos Apps |
|-------|------|---------|-------|-----------------|
| `coordenador@teste.com` | Maria Coordenadora | coordinator | `Teste123` | PEI Collab, Gestão Escolar, Plano AEE, Planejamento, Blog, Atividades |
| `gestor.escolar@teste.com` | Carlos Gestor Escolar | school_manager | `Teste123` | PEI Collab, Gestão Escolar, Plano AEE, Planejamento, Blog, Atividades, Transporte, Merenda |
| `diretor.escola@teste.com` | Diretor da Escola | school_director | `Teste123` | PEI Collab, Gestão Escolar, Plano AEE, Planejamento, Blog, Atividades, Transporte, Merenda |
| `professor.aee@teste.com` | Ana Professora AEE | aee_teacher | `Teste123` | PEI Collab, Plano AEE, Planejamento, Blog, Atividades |
| `professor@teste.com` | João Professor | teacher | `Teste123` | PEI Collab, Gestão Escolar, Planejamento, Blog, Atividades |
| `especialista@teste.com` | Dr. Pedro Especialista | specialist | `Teste123` | PEI Collab, Plano AEE |
| `profissional.apoio@teste.com` | Profissional de Apoio | support_professional | `Teste123` | Verificar permissões específicas |
| `familia@teste.com` | Pedro Família | family | `Teste123` | Portal do Responsável, Blog |
| `secretario.educacao@teste.com` | Secretário de Educação | education_secretary | `Teste123` | Todos os apps (exceto Portal do Responsável) |

### Usuários de Teste com Timestamp

Estes usuários foram criados automaticamente e têm timestamp no email:

| Email | Nome | Role(s) |
|-------|------|---------|
| `teste.coordenador.1763824077665@teste.com` | Coordenador Teste | coordinator |
| `teste.professor.1763824077665@teste.com` | Professor Teste | teacher |
| `teste.aee.1763824077665@teste.com` | Professor AEE Teste | aee_teacher |
| `teste.gestor.1763824077665@teste.com` | Gestor Escolar Teste | school_manager |
| `teste.diretor.1763824077665@teste.com` | Diretor Teste | school_director |
| `teste.especialista.1763824077665@teste.com` | Especialista Teste | specialist |
| `teste.apoio.1763824077665@teste.com` | Profissional de Apoio Teste | support_professional |

## Mapeamento de Permissões por App

### PEI Collab
- ✅ superadmin
- ✅ education_secretary
- ✅ coordinator
- ✅ school_manager
- ✅ aee_teacher
- ✅ teacher
- ✅ specialist

### Gestão Escolar
- ✅ superadmin
- ✅ education_secretary
- ✅ coordinator
- ✅ school_manager
- ✅ teacher

### Plano de AEE
- ✅ superadmin
- ✅ education_secretary
- ✅ coordinator
- ✅ school_manager
- ✅ aee_teacher
- ✅ specialist

### Planejamento
- ✅ superadmin
- ✅ education_secretary
- ✅ coordinator
- ✅ school_manager
- ✅ teacher
- ✅ aee_teacher

### Blog Educacional
- ✅ superadmin
- ✅ education_secretary
- ✅ coordinator
- ✅ school_manager
- ✅ teacher
- ✅ aee_teacher
- ✅ family

### Atividades
- ✅ superadmin
- ✅ education_secretary
- ✅ coordinator
- ✅ school_manager
- ✅ teacher
- ✅ aee_teacher

### Portal do Responsável
- ✅ family (apenas)

### Transporte Escolar
- ✅ superadmin
- ✅ education_secretary
- ✅ coordinator
- ✅ school_manager

### Merenda Escolar
- ✅ superadmin
- ✅ education_secretary
- ✅ coordinator
- ✅ school_manager

## Usuários Recomendados para Teste

### 1. Coordenador (Acesso Amplo) ⭐ RECOMENDADO
- **Email**: `coordenador@teste.com`
- **Senha**: `Teste123`
- **Role**: coordinator
- **Apps Disponíveis**: PEI Collab, Gestão Escolar, Plano AEE, Planejamento, Blog, Atividades
- **Ideal para**: Testar a maioria das funcionalidades e permissões

### 2. Gestor Escolar (Acesso Administrativo)
- **Email**: `gestor.escolar@teste.com`
- **Senha**: `Teste123`
- **Role**: school_manager
- **Apps Disponíveis**: PEI Collab, Gestão Escolar, Plano AEE, Planejamento, Blog, Atividades, Transporte Escolar, Merenda Escolar
- **Ideal para**: Testar permissões administrativas e apps de gestão

### 3. Professor AEE (Acesso Especializado)
- **Email**: `professor.aee@teste.com`
- **Senha**: `Teste123`
- **Role**: aee_teacher
- **Apps Disponíveis**: PEI Collab, Plano AEE, Planejamento, Blog, Atividades
- **Ideal para**: Testar apps de educação especial

### 4. Professor (Acesso Básico)
- **Email**: `professor@teste.com`
- **Senha**: `Teste123`
- **Role**: teacher
- **Apps Disponíveis**: PEI Collab, Gestão Escolar, Planejamento, Blog, Atividades
- **Ideal para**: Testar permissões de professor

### 5. Família (Acesso Limitado)
- **Email**: `familia@teste.com`
- **Senha**: `Teste123`
- **Role**: family
- **Apps Disponíveis**: Portal do Responsável, Blog
- **Ideal para**: Testar permissões restritas e portal de família

### 6. Secretário de Educação (Acesso Total)
- **Email**: `secretario.educacao@teste.com`
- **Senha**: `Teste123`
- **Role**: education_secretary
- **Apps Disponíveis**: Todos os apps (exceto Portal do Responsável)
- **Ideal para**: Testar acesso administrativo completo

## Como Testar

1. Acesse: http://localhost:3000/login
2. Use uma das credenciais acima
3. Após login, você será redirecionado para `/apps`
4. Verifique:
   - Apenas apps permitidos aparecem
   - Favoritos funcionam
   - Histórico é registrado
   - Filtros funcionam
   - Animações estão suaves

## Verificar Usuários no Banco

Para verificar todos os usuários disponíveis, execute:

```sql
SELECT 
  u.email,
  p.full_name,
  array_agg(ur.role) as roles
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
GROUP BY u.email, p.full_name
ORDER BY u.email;
```

## Notas Importantes

- ⚠️ As senhas podem variar entre `Teste123` e `Teste123!`
- ⚠️ Alguns usuários podem não ter roles configurados corretamente
- ⚠️ Verifique se o usuário tem roles na tabela `user_roles` para que as permissões funcionem
- ✅ O usuário `coordenador@teste.com` é o mais recomendado para testes gerais

