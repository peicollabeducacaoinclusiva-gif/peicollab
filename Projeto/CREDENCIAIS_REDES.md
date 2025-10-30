# Credenciais Padrão das Redes Municipais

## Redes Criadas

As seguintes redes foram criadas no sistema:

| Rede | Tenant ID | Status |
|------|-----------|--------|
| São Gonçalo dos Campos | `62d992ab-ef6b-4d13-b9c9-6cdfdcb59451` | ✅ Criada |
| Santanópolis | `08f6772d-97ae-43bf-949d-bed4c6c038de` | ✅ Criada |
| Santa Bárbara | `77d9af39-0f4d-4702-9692-62277e13e42e` | ✅ Criada |

---

## Como Criar os Usuários Padrão

### Opção 1: Via Dashboard do Superadmin (Recomendado)

1. Acesse o dashboard do superadmin
2. Vá para a aba **"Usuários"**
3. Clique em **"Novo Usuário"**
4. Preencha os dados abaixo para cada usuário

### Opção 2: Via Supabase Auth Dashboard

1. Acesse o Supabase Dashboard
2. Vá para **Authentication > Users**
3. Clique em **"Add User"**
4. Preencha os dados abaixo
5. Após criar, vá para **Database > Profiles** e adicione o perfil
6. Vá para **Database > User Roles** e adicione o role

---

## Usuários Padrão por Rede

### São Gonçalo dos Campos (SGC)

#### 1. Administrador da Rede
- **E-mail**: `admin@sgc.edu.br`
- **Senha**: `SGC@123456`
- **Nome**: `Administrador SGC`
- **Role**: `education_secretary`
- **Tenant ID**: `62d992ab-ef6b-4d13-b9c9-6cdfdcb59451`

#### 2. Coordenador da Rede
- **E-mail**: `coord@sgc.edu.br`
- **Senha**: `SGC@123456`
- **Nome**: `Coordenador SGC`
- **Role**: `coordinator`
- **Tenant ID**: `62d992ab-ef6b-4d13-b9c9-6cdfdcb59451`

---

### Santanópolis (SAN)

#### 1. Administrador da Rede
- **E-mail**: `admin@sant.edu.br`
- **Senha**: `SAN@123456`
- **Nome**: `Administrador SAN`
- **Role**: `education_secretary`
- **Tenant ID**: `08f6772d-97ae-43bf-949d-bed4c6c038de`

#### 2. Coordenador da Rede
- **E-mail**: `coord@sant.edu.br`
- **Senha**: `SAN@123456`
- **Nome**: `Coordenador SAN`
- **Role**: `coordinator`
- **Tenant ID**: `08f6772d-97ae-43bf-949d-bed4c6c038de`

---

### Santa Bárbara (SBA)

#### 1. Administrador da Rede
- **E-mail**: `admin@sba.edu.br`
- **Senha**: `SBA@123456`
- **Nome**: `Administrador SBA`
- **Role**: `education_secretary`
- **Tenant ID**: `77d9af39-0f4d-4702-9692-62277e13e42e`

#### 2. Coordenador da Rede
- **E-mail**: `coord@sba.edu.br`
- **Senha**: `SBA@123456`
- **Nome**: `Coordenador SBA`
- **Role**: `coordinator`
- **Tenant ID**: `77d9af39-0f4d-4702-9692-62277e13e42e`

---

## Tabela Resumo

| Rede | Usuário Admin | Usuário Coord | Total |
|------|---------------|---------------|-------|
| São Gonçalo dos Campos (SGC) | `admin@sgc.edu.br` | `coord@sgc.edu.br` | 2 |
| Santanópolis (SAN) | `admin@sant.edu.br` | `coord@sant.edu.br` | 2 |
| Santa Bárbara (SBA) | `admin@sba.edu.br` | `coord@sba.edu.br` | 2 |
| **TOTAL** | 3 | 3 | **6 usuários** |

---

## Próximos Passos

1. ✅ Criar as redes (já feito)
2. ⏳ Criar os 6 usuários padrão (ver instruções acima)
3. ⏳ Importar escolas via CSV para cada rede
4. ⏳ Criar diretores e professores para cada escola
5. ⏳ Vincular alunos às escolas

---

## Observações Importantes

- **Senhas**: As senhas seguem o padrão `{SUFIXO}@123456` onde {SUFIXO} são as iniciais da rede
- **E-mails**: Padronizados com domínio `.edu.br` e sufixo da rede
- **Roles**: 
  - `education_secretary`: Administrador/Secretário com acesso total à rede
  - `coordinator`: Coordenador com acesso a gestão de PEIs da rede
- **Segurança**: Após o primeiro acesso, é recomendado alterar as senhas padrão

