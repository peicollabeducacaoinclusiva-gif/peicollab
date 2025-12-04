# 🔑 Credenciais de Teste - Acesso Rápido

**Para testes rápidos do sistema PEI Collab**

---

## 🚀 TESTE RÁPIDO

### 1️⃣ Coordenador (Mais Completo)
```
Email: coord@sgc.edu.br
Senha: SGC@123456
```
**Dashboard:** Fila de PEIs, estatísticas, solicitar PEIs, gerenciar turmas

---

### 2️⃣ Secretário de Educação
```
Email: admin@sgc.edu.br
Senha: SGC@123456
```
**Dashboard:** Visão executiva, todas escolas, upload logo, relatórios rede

---

### 3️⃣ Professor
```
Email: professor@teste.com
Senha: Teste123
```
**Dashboard:** Meus alunos, criar PEI, acompanhar metas

---

## 📊 TABELA COMPLETA DE USUÁRIOS

| Email | Senha | Role | Rede | Funcionalidades Principais |
|-------|-------|------|------|----------------------------|
| **admin@sgc.edu.br** | SGC@123456 | 🔴 Secretary | São Gonçalo | Dashboard executivo, gestão escolas, upload logo |
| **coord@sgc.edu.br** | SGC@123456 | 🎯 Coordinator | São Gonçalo | Validar PEIs, solicitar PEIs, gerenciar turmas |
| **admin@sant.edu.br** | SAN@123456 | 🔴 Secretary | Santanópolis | Dashboard executivo, gestão escolas, upload logo |
| **coord@sant.edu.br** | SAN@123456 | 🎯 Coordinator | Santanópolis | Validar PEIs, solicitar PEIs, gerenciar turmas |
| **admin@sba.edu.br** | SBA@123456 | 🔴 Secretary | Santa Bárbara | Dashboard executivo, gestão escolas, upload logo |
| **coord@sba.edu.br** | SBA@123456 | 🎯 Coordinator | Santa Bárbara | Validar PEIs, solicitar PEIs, gerenciar turmas |
| **admin@teste.com** | Teste123 | 👑 Superadmin | - | ACESSO TOTAL ao sistema |
| **secretario@teste.com** | Teste123 | 🔴 Secretary | Teste | Dashboard executivo |
| **diretor@teste.com** | Teste123 | 🏫 Director | Teste | Gestão escola |
| **professor@teste.com** | Teste123 | 👨‍🏫 Teacher | Teste | Criar/editar PEIs |

---

## 🎭 TESTE POR PERFIL

### 🔴 Secretário de Educação
**Login recomendado:** `admin@sgc.edu.br` / `SGC@123456`

**Funcionalidades para testar:**
- [ ] Ver dashboard executivo com KPIs da rede
- [ ] Acessar lista de todas as escolas
- [ ] Ver estatísticas consolidadas
- [ ] Upload de logo da rede (Settings)
- [ ] Gerenciar professores de múltiplas escolas
- [ ] Exportar relatórios da rede
- [ ] Ver todos PEIs da rede

---

### 🎯 Coordenador Pedagógico
**Login recomendado:** `coord@sgc.edu.br` / `SGC@123456`

**Funcionalidades para testar:**
- [ ] Ver fila de validação de PEIs
- [ ] Aprovar/Retornar PEI
- [ ] Solicitar novo PEI (atribuir professor)
- [ ] Ver estatísticas da escola
- [ ] Gerenciar turmas e professores
- [ ] Gerar token de acesso para família
- [ ] Ver histórico de versões de PEI

---

### 🏫 Diretor Escolar
**Login recomendado:** `diretor@teste.com` / `Teste123`

**Funcionalidades para testar:**
- [ ] Ver dashboard gerencial da escola
- [ ] Ver lista de professores
- [ ] Ver lista de alunos
- [ ] Acessar relatórios escolares
- [ ] Gerenciar turmas
- [ ] Ver todos PEIs da escola

---

### 👨‍🏫 Professor
**Login recomendado:** `professor@teste.com` / `Teste123`

**Funcionalidades para testar:**
- [ ] Ver "Meus Alunos"
- [ ] Criar novo PEI
- [ ] Editar PEI em draft
- [ ] Enviar PEI para aprovação
- [ ] Ver histórico de versões
- [ ] Imprimir PEI em PDF
- [ ] Ver estatísticas pessoais
- [ ] Receber notificações

---

### 👑 Superadmin
**Login recomendado:** `admin@teste.com` / `Teste123`

**Funcionalidades para testar:**
- [ ] Dashboard administrativo completo
- [ ] Gerenciar todas as redes
- [ ] Gerenciar todas as escolas
- [ ] Gerenciar todos os usuários
- [ ] Importar dados via CSV
- [ ] Ver logs de auditoria
- [ ] Configurações do sistema
- [ ] Acesso total a todos os dados

---

## 🧪 CENÁRIOS DE TESTE SUGERIDOS

### Cenário 1: Fluxo Completo de PEI
```
1. Login como Coordenador (coord@sgc.edu.br)
2. Solicitar novo PEI → atribuir professor
3. Logout

4. Login como Professor (professor@teste.com)
5. Ver aluno em "Meus Alunos"
6. Criar PEI (preencher diagnóstico, planejamento)
7. Enviar para aprovação
8. Logout

9. Login como Coordenador (coord@sgc.edu.br)
10. Ver PEI na fila de validação
11. Aprovar ou Retornar com comentários
```

### Cenário 2: Teste de Segurança RLS
```
1. Login como Professor (professor@teste.com)
2. Tentar acessar alunos de outra escola
   → Deve retornar vazio
3. Tentar modificar user_role via console
   → Deve ser bloqueado pelo RLS
```

### Cenário 3: Teste de Rate Limiting
```
1. Acesse página de login
2. Digite email errado 5 vezes
3. Na 6ª tentativa deve bloquear por 15 minutos
```

### Cenário 4: Gestão Multi-Escola
```
1. Login como Secretário (admin@sgc.edu.br)
2. Ver todas escolas da rede
3. Acessar dashboard de cada escola
4. Ver estatísticas consolidadas
```

---

## 📱 TESTE MOBILE

### Responsividade
```
1. Abra DevTools (F12)
2. Ative modo responsivo (Ctrl+Shift+M)
3. Teste em:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)
4. Verifique:
   - Menu responsivo
   - Calendário (1 mês mobile, 2 desktop)
   - Tabs com scroll horizontal
   - Cards adaptáveis
```

---

## ⚠️ PROBLEMAS CONHECIDOS

### Se Login Não Funcionar

**Solução 1:** Verificar se usuário existe
```bash
node scripts/check-test-users.js
```

**Solução 2:** Recriar usuários
```bash
node scripts/verify-and-create-users.js
```

**Solução 3:** Verificar RLS
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('profiles', 'user_roles');
```

---

## 🎯 QUICK REFERENCE

### Login Mais Usado para Testes
```
📧 coord@sgc.edu.br
🔑 SGC@123456
```

### URL de Acesso
```
http://localhost:8080/auth
```

### Dashboard Após Login
```
http://localhost:8080/dashboard
```

---

**💡 Dica:** Salve este arquivo nos favoritos para acesso rápido às credenciais! 🚀

