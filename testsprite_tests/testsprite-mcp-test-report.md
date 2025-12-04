# Relatório de Testes – TestSprite MCP

---

## 1️⃣ Metadados
- **Projeto:** pei-collab  
- **Data:** 2025-11-12  
- **Origem:** Execução automática via `testsprite-mcp`  

---

## 2️⃣ Validação por Requisito

### R1. Autenticação e Controle de Acesso
| Teste | Resultado | Análise |
|-------|-----------|---------|
| TC001 – Authentication Success for Each Role | ❌ | Todas as credenciais válidas retornam **HTTP 400** do endpoint Supabase (`/auth/v1/token`). O fluxo interrompe no login do superadmin. |
| TC002 – Authentication Failure with Incorrect Credentials | ✅ | Validação negativa funciona: credenciais inválidas apresentam mensagem de erro adequada. |
| TC003 – Role-Based Access Control Enforcement | ❌ | Mesmo 400 na autenticação impede avaliar RLS/multiples roles. |

### R2. Fluxo de Criação e Validação de PEI
| Teste | Resultado | Análise |
|-------|-----------|---------|
| TC004 – Create PEI with Multi-Teacher Assignment | ❌ | Bloqueado pelo problema de login (HTTP 400). |
| TC005 – PEI Versioning Ensures Single Active Version Per Student | ❌ | Impossible criar versões; todas tentativas falham na autenticação. |
| TC006 – PEI Approval Workflow and Notification Delivery | ❌ | Workflow não iniciado devido à falha de login. |
| TC018 – Coordinator's PEI Queue Management and Token Generation | ❌ | Coordenador não consegue entrar; fila de validação não pode ser validada. |

### R3. Tokens de Família e Multi-Tenant
| Teste | Resultado | Análise |
|-------|-----------|---------|
| TC009 – Family Access Token Generation and Validation | ❌ | Login do coordenador falhou (HTTP 400). |
| TC010 – Multi-Tenant Data Separation Enforcement | ❌ | Rede/escolas não podem ser verificadas sem autenticação. |

### R4. Perfil do Usuário e Customização
| Teste | Resultado | Análise |
|-------|-----------|---------|
| TC008 – User Profile Editing and Avatar Customization | ❌ | Cadastro cria usuário, porém Supabase exige ativação administrativa; sem ativação não é possível logar e validar edição. |
| TC013 – Custom Network Logo Upload and Display | ❌ | Mesma barreira: conta recém-criada permanece inativa; upload impossível. |

### R5. Relatórios, PDF e Gestão Acadêmica
| Teste | Resultado | Análise |
|-------|-----------|---------|
| TC012 – PDF Generation and Print of PEIs | ❌ | Falha de login impede acessar PEIs e gerar PDF. |
| TC019 – Student and Enrollment Management Historical Records | ❌ | Tanto admin quanto professor não conseguem autenticar. |
| TC020 – Global and Role-Specific Reporting Accuracy and Export | ❌ | Sem login, relatórios globais/importação não foram medidos. |

### R6. Notificações e Auditoria
| Teste | Resultado | Análise |
|-------|-----------|---------|
| TC015 – Real-Time Notifications with Action Handlers | ❌ | Sem acesso, eventos de PEI não são disparados; notificação não pôde ser avaliada. |
| TC016 – System Logging and Audit Trails | ❌ | Formulário de cadastro retorna erro 400; auditoria não pôde ser exercitada. |

### R7. Operação Offline e PWA
| Teste | Resultado | Análise |
|-------|-----------|---------|
| TC007 – Offline Data Caching and Synchronization | ❌ | Testes dependem de login inicial; IndexedDB/sync não avaliados. |
| TC017 – PWA Installation and Service Worker Offline Caching | ✅ | Instalação PWA e cache offline confirmados com sucesso. |

### R8. Interface e Usabilidade
| Teste | Resultado | Análise |
|-------|-----------|---------|
| TC011 – Responsive UI on Mobile and Desktop | ❌ | Cobertura apenas em desktop; falta execução mobile (drawer, tabs). |
| TC014 – Dark Mode Toggle Persistence | ❌ | Toggle dark mode não foi localizado na UI; não houve mudança de tema. |

---

## 3️⃣ Cobertura e Métricas
- **Total de testes:** 20  
- **Aprovados:** 2  
- **Reprovados/Parciais:** 18  
- **Taxa de sucesso:** **10%**

| Requisito | Testes | ✅ | ❌ |
|-----------|--------|----|----|
| R1 Autenticação e Controle de Acesso | 3 | 1 | 2 |
| R2 Fluxo de Criação e Validação de PEI | 4 | 0 | 4 |
| R3 Tokens de Família e Multi-Tenant | 2 | 0 | 2 |
| R4 Perfil do Usuário e Customização | 2 | 0 | 2 |
| R5 Relatórios, PDF e Gestão Acadêmica | 3 | 0 | 3 |
| R6 Notificações e Auditoria | 2 | 0 | 2 |
| R7 Operação Offline e PWA | 2 | 1 | 1 |
| R8 Interface e Usabilidade | 2 | 0 | 2 |

---

## 4️⃣ Principais Lacunas e Riscos
1. **Autenticação Supabase devolvendo 400** para todas as credenciais conhecidas (superadmin, coordinator, etc.), o que bloqueia praticamente todos os cenários funcionais. É necessário validar credenciais, políticas RLS e possíveis mudanças na instância `sb-fximylewmvsllkdczovj`.
2. **Processo de ativação de contas**: cadastros realizados em teste ficam pendentes de aprovação administrativa, impedindo validação de fluxos de self-service (perfil, custom logo, notificações).
3. **Funcionalidades dependentes de login** (filas de PEI, tokens familiares, relatórios, PDF) ficaram sem cobertura efetiva — alto risco de regressão não detectada.
4. **Dark mode e responsividade mobile**: toggle não identificado e layouts mobile não foram confirmados; requer inspeção manual da interface.
5. **Violação de supostos requisitos de UX**: testes de usabilidade (TC011 e TC014) demonstram ausência ou inacessibilidade dos controles esperados.

---

## 5️⃣ Recomendações Imediatas
- **Restaurar o fluxo de autenticação** garantindo que os usuários de teste possuam credenciais válidas e contas ativas. Considerar seeds automatizados ou mocks para cenários críticos.
- **Reexecutar a suíte** após o ajuste de login para cobrir fluxos de PEI, relatórios e notificações, hoje sem garantia.
- **Investigar UI**: verificar presença/visibilidade do toggle dark mode e preparar ambiente para rodar cenários mobile (emulador ou viewport controlado).
- **Revisar políticas de criação/ativação de usuário** para testes automatizados: permitir logins imediatos ou prover contas pré-ativadas.

---

## 6️⃣ Próximos Passos
1. Corrigir autenticação Supabase (credenciais, RLS, variáveis de ambiente, múltiplos GoTrueClient).
2. Habilitar/fornecer contas de teste ativas para cada role exigida pelos cenários.
3. Repetir a suíte TestSprite para validar PEIs, tokens, relatórios e notificações.
4. Complementar cobertura manual/automática para mobile e dark mode.

---

_Relatório consolidado pelo agente MCP Testsprite-integrated._  

