# Guia de Validação Completa - Implementações Fase 1

**Data**: Janeiro 2025  
**Status**: ✅ Pronto para Validação

---

## 📋 Checklist de Validação

### 1. Interface de Alertas - `/alerts`

#### Pré-requisitos
- [ ] Usuário autenticado
- [ ] Escola vinculada ao perfil
- [ ] Dados de frequência cadastrados

#### Passos de Validação

1. **Acesso à Página**
   - [ ] Acessar `/alerts` no navegador
   - [ ] Verificar se a página carrega corretamente
   - [ ] Verificar se há tabs visíveis ("Alertas Gerais" e "Frequência (75%)")

2. **Tab "Frequência (75%)"**
   - [ ] Clicar na tab "Frequência (75%)"
   - [ ] Verificar se o componente `AttendanceAlertsDashboard` é exibido
   - [ ] Verificar se há mensagem de carregamento inicial (se necessário)

3. **Estatísticas**
   - [ ] Verificar se os cards de estatísticas aparecem:
     - Total de Alertas
     - Críticos (<50%)
     - Alertas (50-74%)
   - [ ] Verificar se os números estão corretos
   - [ ] Verificar se os ícones aparecem corretamente

4. **Gráfico de Distribuição**
   - [ ] Verificar se o gráfico de barras aparece
   - [ ] Verificar se as cores estão corretas:
     - Verde para OK (≥75%)
     - Laranja para Alerta (50-74%)
     - Vermelho para Crítico (<50%)
   - [ ] Verificar se os valores estão corretos

5. **Filtros**
   - [ ] Testar filtro "Todos"
   - [ ] Testar filtro "Críticos"
   - [ ] Testar filtro "Alertas"
   - [ ] Verificar se a lista é filtrada corretamente
   - [ ] Verificar se os contadores são atualizados

6. **Lista de Alertas**
   - [ ] Verificar se a lista de alunos aparece
   - [ ] Verificar se cada card mostra:
     - Nome do aluno
     - Turma
     - Frequência percentual
     - Período (data início - data fim)
     - Status (badge)
   - [ ] Verificar se os cards críticos têm borda vermelha
   - [ ] Verificar se os cards de alerta têm borda laranja

7. **Estado Vazio**
   - [ ] Verificar se aparece mensagem quando não há alertas
   - [ ] Verificar se o ícone de "CheckCircle" aparece
   - [ ] Verificar se a mensagem é clara

8. **Botão Atualizar**
   - [ ] Clicar no botão "Atualizar"
   - [ ] Verificar se os dados são recarregados
   - [ ] Verificar se há feedback visual (loading)

9. **Console do Navegador**
   - [ ] Abrir DevTools (F12)
   - [ ] Verificar se há erros no console
   - [ ] Verificar se há warnings relevantes

10. **Network Tab**
    - [ ] Verificar se a chamada RPC `get_students_below_attendance_threshold` é feita
    - [ ] Verificar se a resposta é bem-sucedida
    - [ ] Verificar tempo de resposta

---

### 2. Edge Function - educacenso-export

#### Pré-requisitos
- [ ] Supabase CLI instalado
- [ ] Autenticado no Supabase
- [ ] Projeto vinculado

#### Passos de Deploy

1. **Verificar Supabase CLI**
   ```bash
   supabase --version
   ```
   - [ ] CLI instalado e funcionando

2. **Fazer Login (se necessário)**
   ```bash
   supabase login
   ```
   - [ ] Login realizado com sucesso

3. **Vincular Projeto (se necessário)**
   ```bash
   supabase link --project-ref <seu-project-ref>
   ```
   - [ ] Projeto vinculado

4. **Deploy da Função**
   ```bash
   supabase functions deploy educacenso-export
   ```
   - [ ] Deploy executado sem erros
   - [ ] Função listada em `supabase functions list`

#### Passos de Teste

1. **Via Supabase Dashboard**
   - [ ] Acessar Supabase Dashboard
   - [ ] Ir em "Edge Functions"
   - [ ] Selecionar `educacenso-export`
   - [ ] Usar o "Invoke" com payload:
     ```json
     {
       "tenantId": "<uuid-do-tenant>",
       "schoolId": null,
       "academicYear": 2025
     }
     ```
   - [ ] Verificar resposta (deve retornar arquivo TXT)

2. **Via Frontend**
   - [ ] Acessar página `/censo`
   - [ ] Clicar em "Exportar Dados"
   - [ ] Verificar se o arquivo é baixado
   - [ ] Verificar formato do arquivo (TXT com delimitador `|`)
   - [ ] Verificar se o arquivo contém:
     - Registro 00 (Cabeçalho)
     - Registro 20 (Escolas)
     - Registro 30 (Turmas)
     - Registro 40 (Alunos)
     - Registro 50 (Profissionais)
     - Registro 60 (Matrículas)
     - Registro 99 (Rodapé)

3. **Validação de Erros**
   - [ ] Testar com dados inválidos
   - [ ] Verificar se retorna erro apropriado
   - [ ] Verificar se validação funciona

---

### 3. Página de Aprovação - `/student-approval`

#### Pré-requisitos
- [ ] Usuário autenticado
- [ ] Escola vinculada ao perfil
- [ ] Turmas cadastradas
- [ ] Alunos matriculados
- [ ] Dados de frequência cadastrados

#### Passos de Validação

1. **Acesso à Página**
   - [ ] Acessar `/student-approval` no navegador
   - [ ] Verificar se a página carrega corretamente
   - [ ] Verificar se o título "Aprovação de Alunos" aparece

2. **Filtros**
   - [ ] Selecionar escola no filtro
   - [ ] Selecionar turma no filtro
   - [ ] Verificar se o ano letivo está correto
   - [ ] Testar busca por nome de aluno

3. **Estatísticas**
   - [ ] Verificar se os cards aparecem:
     - Total de Alunos
     - Elegíveis para Aprovação
     - Pendentes (Frequência < 75%)
   - [ ] Verificar se os números estão corretos

4. **Lista de Alunos**
   - [ ] Verificar se a lista de alunos aparece após selecionar turma
   - [ ] Verificar se cada card mostra:
     - Nome do aluno
     - Turma
     - Frequência percentual
     - Nota Final (se houver)
     - Ano Letivo
   - [ ] Verificar se alunos elegíveis têm badge verde
   - [ ] Verificar se alunos pendentes têm badge vermelho
   - [ ] Verificar se alunos pendentes mostram motivo

5. **Botão Aprovar**
   - [ ] Verificar se botão está habilitado para alunos elegíveis
   - [ ] Verificar se botão está desabilitado para alunos pendentes
   - [ ] Clicar em "Aprovar" para aluno elegível

6. **Dialog de Aprovação**
   - [ ] Verificar se o `StudentApprovalDialog` abre
   - [ ] Verificar se mostra nome do aluno
   - [ ] Verificar se valida frequência automaticamente
   - [ ] Verificar se mostra mensagem de validação
   - [ ] Se frequência < 75%, verificar se bloqueia aprovação
   - [ ] Se frequência ≥ 75%, verificar se permite aprovação

7. **Fluxo de Aprovação**
   - [ ] Clicar em "Aprovar Aluno" (se elegível)
   - [ ] Verificar se há loading durante aprovação
   - [ ] Verificar se toast de sucesso aparece
   - [ ] Verificar se o status do aluno é atualizado
   - [ ] Verificar se a lista é recarregada

8. **Validação de Frequência**
   - [ ] Testar com aluno com frequência < 75%
   - [ ] Verificar se aprovação é bloqueada
   - [ ] Verificar se mensagem de erro aparece
   - [ ] Verificar se toast de erro aparece

9. **Console do Navegador**
   - [ ] Abrir DevTools (F12)
   - [ ] Verificar se há erros no console
   - [ ] Verificar chamadas RPC:
     - `can_approve_student`
     - `get_students_below_attendance_threshold`

10. **Network Tab**
    - [ ] Verificar chamadas de API
    - [ ] Verificar se respostas são bem-sucedidas
    - [ ] Verificar tempo de resposta

---

## 🐛 Problemas Conhecidos

Nenhum problema conhecido no momento.

---

## 📝 Notas Importantes

### Interface de Alertas
- O componente usa a função RPC `get_students_below_attendance_threshold`
- O threshold padrão é 75%, mas pode ser ajustado
- Os alertas são calculados automaticamente via triggers no banco

### Edge Function
- A função valida dados antes de gerar arquivo
- Retorna erro se dados inválidos
- Formato do arquivo: TXT com delimitador `|`

### Página de Aprovação
- A validação de frequência é feita automaticamente
- Alunos com frequência < 75% não podem ser aprovados
- A aprovação atualiza o status da matrícula

---

## 🔧 Como Reportar Problemas

Se encontrar algum problema:

1. Anotar o passo exato onde ocorreu
2. Capturar screenshot (se possível)
3. Verificar console do navegador para erros
4. Verificar Network tab para chamadas de API
5. Verificar logs do Supabase (se aplicável)
6. Reportar no issue tracker

---

## ✅ Critérios de Sucesso

### Interface de Alertas
- ✅ Página carrega sem erros
- ✅ Tab "Frequência (75%)" funciona
- ✅ Estatísticas são exibidas corretamente
- ✅ Gráfico é renderizado
- ✅ Filtros funcionam
- ✅ Lista de alertas é exibida

### Edge Function
- ✅ Deploy bem-sucedido
- ✅ Função responde corretamente
- ✅ Arquivo é gerado no formato correto
- ✅ Validação funciona

### Página de Aprovação
- ✅ Página carrega sem erros
- ✅ Filtros funcionam
- ✅ Lista de alunos é exibida
- ✅ Validação de frequência funciona
- ✅ Aprovação funciona para alunos elegíveis
- ✅ Bloqueio funciona para alunos pendentes

---

**Última atualização**: Janeiro 2025

