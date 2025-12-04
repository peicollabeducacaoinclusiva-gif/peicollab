# 👥 CRIAÇÃO AUTOMÁTICA DE COORDENADORES

## 🎯 **NOVA FUNCIONALIDADE**

O sistema agora **cria automaticamente** os coordenadores que não existem durante a importação do CSV!

---

## ⚙️ **COMO FUNCIONA**

### **Processo Automático:**

```
Email no CSV: erotildesrosa33@gmail.com
     ↓
1. Sistema busca se existe
     ↓
2. Se NÃO existe:
   • Extrai username: "erotildesrosa33"
   • Cria nome: "Erotildesrosa33" → "Erotildesrosa33"
   • Cria usuário em auth.users
   • Cria profile em profiles
   • Adiciona role 'coordinator'
   • Define senha padrão: "PeiCollab@2025"
     ↓
3. Retorna ID do coordenador
     ↓
4. Continua importação do PEI
```

---

## 📋 **CREDENCIAIS GERADAS**

### **Formato:**

| Dado | Origem | Exemplo |
|------|--------|---------|
| **Email** | Do CSV | `joao.silva@email.com` |
| **Username** | Parte antes do @ | `joao.silva` |
| **Nome Completo** | Username formatado | `Joao Silva` |
| **Senha Padrão** | Fixa | `PeiCollab@2025` |

---

## 📊 **EXEMPLO REAL (São Gonçalo)**

### **Coordenadores no CSV:**

```csv
erotildesrosa33@gmail.com
jaquelinnesouzasilva27@gmail.com
vi_garcia19@hotmail.com
ecmnoidecerqueira@gmail.com
calin3.estrela@gmail.com
michellesilvagomes@gmail.com
costalidiane65@gmail.com
rosileidesoaressantos@hotmail.commail.com
rosileidesoaressantos82@gmail.com
suzy-ecv@hotmail.com
lucianasgc@gmail.com
```

### **Coordenadores Criados Automaticamente:**

```
1. 👤 Erotildesrosa33
   📧 Email: erotildesrosa33@gmail.com
   🔑 Username: erotildesrosa33
   🔒 Senha padrão: PeiCollab@2025

2. 👤 Jaquelinnesouzasilva27
   📧 Email: jaquelinnesouzasilva27@gmail.com
   🔑 Username: jaquelinnesouzasilva27
   🔒 Senha padrão: PeiCollab@2025

3. 👤 Vi Garcia19
   📧 Email: vi_garcia19@hotmail.com
   🔑 Username: vi_garcia19
   🔒 Senha padrão: PeiCollab@2025

... (11 coordenadores no total)
```

---

## 🔒 **SEGURANÇA**

### **Senha Padrão:**
```
PeiCollab@2025
```

**⚠️ IMPORTANTE:**
- ✅ Todos os coordenadores devem **alterar a senha** no primeiro acesso
- ✅ Sistema deve forçar troca de senha no primeiro login
- ✅ Orientar coordenadores sobre segurança

---

## 📝 **SAÍDA DO SCRIPT**

### **Durante Importação:**

```
🔄 Processando...

  ✅ Novo coordenador criado: Erotildesrosa33 (erotildesrosa33@gmail.com)
     Username: erotildesrosa33 | Senha: PeiCollab@2025

  [1/32] Josué Gonçalves de Oliveira ... ✅ OK (3 metas geradas)
  [2/32] Josué Gonçalves de Oliveira ... ✅ OK (3 metas geradas)
  
  ✅ Novo coordenador criado: Vi Garcia19 (vi_garcia19@hotmail.com)
     Username: vi_garcia19 | Senha: PeiCollab@2025
  
  [3/32] João Carlos Bispo ... ✅ OK (3 metas geradas)
  ...
```

### **Relatório Final:**

```
╔══════════════════════════════════════════════════════════╗
║  📊 RELATÓRIO FINAL                                     ║
╚══════════════════════════════════════════════════════════╝

  Total processados: 32
  ✅ Sucesso:        28
  ❌ Erros:          4

  🎯 Metas geradas:  84
  📈 Média por PEI:  3.0

╔══════════════════════════════════════════════════════════╗
║  👥 COORDENADORES CRIADOS                               ║
╚══════════════════════════════════════════════════════════╝

  Total de coordenadores novos: 11

  ⚙️  CREDENCIAIS DE ACESSO:

  1. 👤 Erotildesrosa33
     📧 Email: erotildesrosa33@gmail.com
     🔑 Username: erotildesrosa33
     🔒 Senha padrão: PeiCollab@2025

  2. 👤 Jaquelinnesouzasilva27
     📧 Email: jaquelinnesouzasilva27@gmail.com
     🔑 Username: jaquelinnesouzasilva27
     🔒 Senha padrão: PeiCollab@2025

  ... (mais 9 coordenadores)

  ⚠️  IMPORTANTE: Oriente os coordenadores a alterarem a senha no primeiro acesso!
```

---

## 🔄 **MIGRAÇÃO SQL**

### **Arquivos a Executar:**

```bash
# 1. Migração principal (já foi criada)
scripts/add_diagnosis_fields_and_import_logic.sql

# 2. NOVO: Criação automática de coordenadores
scripts/add_auto_coordinator_creation.sql
```

**⚠️ NOTA:** A criação real dos usuários é feita no TypeScript via `supabase.auth.admin.createUser()`, as funções SQL são auxiliares.

---

## 🚀 **BENEFÍCIOS**

### **Antes (Manual):**
```
1. Listar emails únicos do CSV
2. Cadastrar cada coordenador manualmente
3. Definir senhas individuais
4. Compartilhar credenciais
5. Executar importação

Tempo: ~30-60 minutos
```

### **Agora (Automático):**
```
1. Executar importação

Tempo: ~2-5 minutos
```

**Ganho:** **90-95% mais rápido!** 🚀

---

## 📋 **CHECKLIST ATUALIZADO**

```bash
# ✅ AGORA É AINDA MAIS SIMPLES:

1. Executar migração SQL principal
   scripts/add_diagnosis_fields_and_import_logic.sql

2. Executar migração de coordenadores
   scripts/add_auto_coordinator_creation.sql

3. Instalar dependência
   npm install @types/papaparse

4. Executar importação (coordenadores são criados automaticamente!)
   npx ts-node scripts/import_csv_pei.ts PEIColaborativo-SGC.csv

5. Copiar e compartilhar credenciais do relatório final
```

---

## 🎓 **REGRAS DE NEGÓCIO**

### **Criação de Username:**

```typescript
// Email: joao.silva@escola.com
const username = email.split('@')[0]
// username = "joao.silva"

// Criar nome formatado
const fullName = username
  .replace(/[._]/g, ' ')      // joao silva
  .split(' ')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  .join(' ')
// fullName = "Joao Silva"
```

### **Casos Especiais:**

| Email | Username | Nome Criado |
|-------|----------|-------------|
| `joao.silva@email.com` | `joao.silva` | `Joao Silva` |
| `maria_santos123@email.com` | `maria_santos123` | `Maria Santos123` |
| `coordenador@escola.com.br` | `coordenador` | `Coordenador` |
| `a.b.c@email.com` | `a.b.c` | `A B C` |

---

## ⚠️ **LIMITAÇÕES E AVISOS**

### **Email Duplicado:**
- ✅ Se email já existe, **reutiliza** o coordenador existente
- ❌ NÃO cria duplicado

### **Escola Não Encontrada:**
- ❌ Importação falha
- **Solução:** Cadastrar escola primeiro

### **Senha Padrão:**
- ⚠️ **Todos usam a mesma senha inicial**
- ✅ **DEVE** ser alterada no primeiro acesso
- 🔒 Implementar "force_password_change" no sistema

---

## 📧 **TEMPLATE DE EMAIL PARA COORDENADORES**

```
Assunto: Acesso ao Sistema PEI Colaborativo - São Gonçalo

Olá [Nome do Coordenador],

Você foi cadastrado(a) no Sistema PEI Colaborativo da Rede Municipal de São Gonçalo do Amarante.

📧 SUAS CREDENCIAIS DE ACESSO:

   • Email: [email]
   • Senha inicial: PeiCollab@2025
   • Link: https://peicollab.com.br

⚠️ IMPORTANTE:
Por favor, altere sua senha no primeiro acesso por questões de segurança.

Qualquer dúvida, entre em contato com a coordenação.

Atenciosamente,
Equipe PEI Colaborativo
```

---

## 🔍 **VERIFICAÇÃO PÓS-IMPORTAÇÃO**

### **SQL para listar coordenadores criados:**

```sql
-- Ver coordenadores criados hoje
SELECT 
  p.full_name,
  p.email,
  split_part(p.email, '@', 1) as username,
  'PeiCollab@2025' as senha_padrao,
  p.created_at,
  COUNT(pei.id) as peis_criados
FROM profiles p
INNER JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN peis pei ON pei.created_by = p.id
WHERE ur.role = 'coordinator'
AND p.created_at::date = CURRENT_DATE
GROUP BY p.id, p.full_name, p.email, p.created_at
ORDER BY p.created_at DESC;
```

---

## ✅ **RESUMO**

**O que mudou:**
- ✅ Coordenadores são criados **automaticamente** durante importação
- ✅ Username = parte antes do @ do email
- ✅ Senha padrão: `PeiCollab@2025`
- ✅ Nome formatado do username
- ✅ Relatório mostra credenciais no final

**Vantagens:**
- 🚀 **95% mais rápido**
- ✅ **Zero trabalho manual**
- ✅ **Sem erros de cadastro**
- ✅ **Credenciais padronizadas**

**Atenção:**
- ⚠️ Senha padrão deve ser alterada
- ⚠️ Orientar coordenadores
- ⚠️ Implementar force_password_change

---

**🎊 São Gonçalo pronto com criação automática de coordenadores! 🚀**

