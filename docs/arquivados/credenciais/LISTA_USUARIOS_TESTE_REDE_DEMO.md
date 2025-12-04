# 👥 Lista de Usuários de Teste - Rede Demo

## 🏢 Informações da Rede
- **Nome da Rede:** Rede de Teste Demo
- **Escola:** Escola Municipal de Teste

---

## 📋 Usuários por Perfil

### 1. 🔴 Superadmin (Nível 1 - Mais Alto)
**Nome:** Super Admin Sistema  
**Email:** superadmin@test.com  
**Senha:** Super@123  
**Descrição:** Acesso total ao sistema, gerencia múltiplas redes

---

### 2. 🟠 Education Secretary (Nível 2)
**Nome:** Secretário de Educação  
**Email:** secretary@test.com  
**Senha:** Secretary@123  
**Descrição:** Gerencia toda a rede de ensino, acesso a todas as escolas da rede

---

### 3. 🟡 Coordinator (Nível 3)
**Nome:** Maria Coordenadora  
**Email:** coordinator@test.com  
**Senha:** Coord@123  
**Descrição:** Coordena uma escola específica, aprova PEIs, gerencia professores

---

### 4. 🟢 School Manager (Nível 3)
**Nome:** Carlos Gestor Escolar  
**Email:** manager@test.com  
**Senha:** Manager@123  
**Descrição:** Gerencia operações administrativas da escola

---

### 5. 🔵 AEE Teacher (Nível 4)
**Nome:** Ana Professora AEE  
**Email:** aee@test.com  
**Senha:** Aee@123  
**Descrição:** Professor de Atendimento Educacional Especializado

---

### 6. 🟣 Teacher (Nível 4)
**Nome:** João Professor  
**Email:** teacher@test.com  
**Senha:** Teacher@123  
**Descrição:** Professor comum, cria e edita PEIs de seus alunos

---

### 7. 🟤 Specialist (Nível 5)
**Nome:** Dr. Pedro Especialista  
**Email:** specialist@test.com  
**Senha:** Spec@123  
**Descrição:** Especialista externo (psicólogo, fonoaudiólogo, etc.)

---

### 8. ⚪ Family (Nível 6 - Mais Baixo)
**Nome:** Pedro Família  
**Email:** family@test.com  
**Senha:** Family@123  
**Descrição:** Familiar/responsável pelo aluno, visualiza e aprova PEIs

---

## 📊 Status de Testes

| Perfil | Status | Última Verificação |
|--------|--------|-------------------|
| Superadmin | ✅ Testado | 04/11/2025 |
| Education Secretary | ✅ Testado | 04/11/2025 |
| Coordinator | ✅ Testado Profundamente + Corrigido | 04/11/2025 |
| School Manager | ✅ Testado + Corrigido | 04/11/2025 |
| AEE Teacher | ✅ Testado | 04/11/2025 |
| Teacher | ✅ Testado + Dados Demo | 04/11/2025 |
| Specialist | ✅ Testado | 04/11/2025 |
| Family | ✅ Testado | 04/11/2025 |

---

## 🔐 Observações de Segurança

1. ✅ Todos os usuários estão vinculados à **Escola Municipal de Teste**
2. ✅ RLS (Row Level Security) aplicado corretamente
3. ✅ Políticas de segurança revisadas e corrigidas
4. ✅ Sistema de rate limiting implementado
5. ✅ Validação de inputs implementada

---

## 🎯 Plano de Testes

### Ordem de Execução (Privilégio Decrescente)
1. ✅ **Superadmin** - Concluído
2. ⏳ **Education Secretary** - Próximo
3. ⏳ **Coordinator**
4. ⏳ **School Manager**  
5. ⏳ **AEE Teacher**
6. ⏳ **Teacher**
7. ⏳ **Specialist**
8. ⏳ **Family**

### Áreas de Teste por Dashboard
- ✅ Login/Autenticação
- ✅ Carregamento de perfil
- ✅ Visualização de estatísticas
- ⏳ Listagem de dados (alunos, PEIs, etc.)
- ⏳ Criação de registros
- ⏳ Edição de registros
- ⏳ Exclusão de registros
- ⏳ Controle de acesso (RLS)
- ⏳ Funcionalidades específicas do perfil

---

**Última atualização:** 04 de Novembro de 2025, 16:52

