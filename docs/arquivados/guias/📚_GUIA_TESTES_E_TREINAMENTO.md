# 📚 GUIA DE TESTES E TREINAMENTO - PEI COLLAB 2.2

## 🎯 **Visão Geral**

Este guia fornece instruções completas para:
1. **Testar** os novos componentes
2. **Validar** o fluxo de avaliação de metas
3. **Revisar** as recomendações automáticas
4. **Treinar** usuários nos novos recursos

---

## 📂 **NOVA ESTRUTURA DE TABS**

O sistema agora possui **7 abas** no formulário de criação/edição de PEI:

| # | Tab | Ícone | Descrição |
|---|-----|-------|-----------|
| 1 | **Identificação** | 👤 | Dados do aluno |
| 2 | **Diagnóstico** | 🩺 | Perfil, barreiras, histórico |
| 3 | **Planejamento** | 🎯 | Metas e recursos |
| 4 | **Adaptações** | 💡 | ✨ **NOVO** - Recomendações automáticas |
| 5 | **Avaliação** | ✅ | ✨ **NOVO** - Datas e progresso |
| 6 | **Encaminhamentos** | 📤 | Referências e observações |
| 7 | **Relatório** | 📄 | Visualização final |

---

## 🧪 **ROTEIRO DE TESTES COMPLETO**

### **TESTE 1: Criar Novo PEI com Todos os Campos**

#### **Passo 1: Identificação**
1. Acessar `/pei/create`
2. Selecionar um aluno
3. Verificar se dados aparecem corretamente

**✅ Validar**:
- [ ] Nome, data de nascimento, idade
- [ ] Informações de contato

---

#### **Passo 2: Diagnóstico**
1. Ir para aba "Diagnóstico"
2. Preencher todos os campos:
   - [ ] Histórico do estudante
   - [ ] Interesses
   - [ ] Necessidades especiais
   - [ ] **💪 Habilidades** (NOVO)
   - [ ] **⚠️ Aversões** (NOVO)
   - [ ] Barreiras (selecionar pelo menos 3)
   - [ ] **💬 Comentários sobre barreiras** (NOVO)

**✅ Validar**:
- [ ] Todos os campos salvam corretamente
- [ ] Tooltips aparecem com exemplos
- [ ] Badges de barreira aparecem

---

#### **Passo 3: Planejamento**
1. Ir para aba "Planejamento"
2. Clicar em "Gerar com IA" (se preencheu diagnóstico)
3. **Criar pelo menos 3 metas manualmente**:

**Meta 1 - Acadêmica**:
- [ ] Categoria: "Acadêmica"
- [ ] Descrição: "Ler textos simples com 80% de compreensão até dezembro"
- [ ] Data alvo: 31/12/2025
- [ ] Observações: Estratégias específicas

**Meta 2 - Funcional**:
- [ ] Categoria: "Funcional"
- [ ] Descrição: "Participar de atividades em grupo 3x por semana"
- [ ] Data alvo: 30/06/2025
- [ ] Observações: Técnicas de socialização

**Meta 3 - Acadêmica**:
- [ ] Categoria: "Acadêmica"
- [ ] Descrição: "Escrever o próprio nome de forma legível"
- [ ] Data alvo: 31/08/2025

**✅ Validar**:
- [ ] Badges de categoria aparecem (📚 / 🎯)
- [ ] Botão "Avaliar Meta" aparece
- [ ] Campos obrigatórios marcados com *

4. **Adicionar 2 recursos de acessibilidade**:

**Recurso 1**:
- [ ] Tipo: "Material adaptado"
- [ ] Descrição: "Livros com letras ampliadas"
- [ ] Frequência: "Diária"

**Recurso 2**:
- [ ] Tipo: "Tecnologia assistiva"
- [ ] Descrição: "Leitor de tela NVDA"
- [ ] Frequência: "Semanal"

---

#### **Passo 4: Adaptações** ✨ NOVO
1. Ir para aba "Adaptações"
2. Verificar lista de barreiras identificadas
3. Clicar em um tipo de barreira

**✅ Validar**:
- [ ] Badges de severidade aparecem
- [ ] Ao clicar, barreira fica destacada
- [ ] Tabs "Adaptações" e "Estratégias" aparecem
- [ ] Lista de recomendações aparece
- [ ] Diferenciação visual (roxo/verde) funciona
- [ ] Exemplos práticos aparecem
- [ ] Resumo consolidado no final

**Testar para cada tipo**:
- [ ] Pedagógica 📚
- [ ] Comunicacional 💬
- [ ] Atitudinal 🤝
- [ ] Arquitetônica 🏛️
- [ ] Tecnológica 💻
- [ ] Cognitiva 🧠
- [ ] Comportamental 🎭
- [ ] Sensorial 👁️
- [ ] Motora 🏃
- [ ] Social 👥

---

#### **Passo 5: Avaliação** ✨ NOVO
1. Ir para aba "Avaliação"

**Datas de Revisão**:
- [ ] Última revisão: (deixar em branco se primeira vez)
- [ ] Data de revisão atual: Data de hoje
- [ ] Próxima revisão programada: +3 meses

**Progresso Geral**:
- [ ] Selecionar: "Bom - Alcançou os objetivos"
- [ ] Descrição do progresso: Texto detalhado
- [ ] Avaliação das metas: Texto sobre metas

**Feedback da Família**:
- [ ] Comentários: "A família relata que o aluno está mais confiante e participa mais das atividades familiares"

**Observações e Ajustes**:
- [ ] Observações gerais: Comportamento, interação
- [ ] Ajustes necessários: "Aumentar complexidade das atividades de leitura"

**✅ Validar**:
- [ ] Cores mudam baseado no progresso
- [ ] Ícones aparecem (✅📈⏳⚠️)
- [ ] Campos salvam corretamente
- [ ] Feedback da família será visível no relatório

---

#### **Passo 6: Encaminhamentos**
1. Ir para aba "Encaminhamentos"
2. Adicionar pelo menos 1 encaminhamento

**✅ Validar**:
- [ ] Pode adicionar múltiplos encaminhamentos
- [ ] Campos salvam

---

#### **Passo 7: Relatório**
1. Ir para aba "Relatório"
2. Rolar toda a página

**✅ Validar**:
- [ ] Seção 1: Identificação do Aluno
- [ ] Seção 2: Diagnóstico
  - [ ] **Habilidades aparecem** (NOVO)
  - [ ] **Aversões aparecem** (NOVO)
  - [ ] **Comentários sobre barreiras aparecem** (NOVO)
- [ ] Seção 3: Planejamento
  - [ ] Metas com categoria e data alvo
- [ ] Seção 4: Encaminhamentos
- [ ] **Seção 5: Comentários da Família** ✨ NOVO
  - [ ] Card com fundo azul
  - [ ] Ícone 👨‍👩‍👧‍👦
  - [ ] Feedback como citação
  - [ ] Data de registro
- [ ] Seção 6: Assinaturas

---

### **TESTE 2: Avaliar Meta** ✨ NOVO

1. Criar ou abrir um PEI
2. Ir para aba "Planejamento"
3. Clicar em "Avaliar Meta" em qualquer meta

**No Modal**:
1. **Slider de Progresso**:
   - [ ] Arrastar slider de 0 a 100%
   - [ ] Cores mudam (vermelho → amarelo → azul → verde)
   - [ ] Porcentagem atualiza em tempo real
   - [ ] Label muda ("Necessita atenção" → "Excelente progresso")

2. **Data da Avaliação**:
   - [ ] Preencher com data de hoje
   - [ ] Campo obrigatório

3. **Avaliador**:
   - [ ] Preencher: "Prof. Maria Silva"

4. **Status Atual**:
   - [ ] Preencher: "O aluno consegue ler 8 de 10 palavras simples com apoio visual"

5. **Evidências**:
   - [ ] Preencher: "Atividade realizada em 15/01/2025. Aluno leu corretamente 8 palavras de uma lista de 10, mostrando melhora de 30% em relação ao mês anterior. Demonstra maior confiança ao ler palavras conhecidas."

6. **Próximas Ações**:
   - [ ] Preencher: "Aumentar gradualmente a complexidade das palavras. Reduzir o apoio visual progressivamente. Introduzir frases curtas."

7. **Salvar**:
   - [ ] Clicar em "Salvar Avaliação"
   - [ ] Toast de confirmação aparece
   - [ ] Modal fecha

**Voltar ao Card da Meta**:
- [ ] Badge de % aparece no cabeçalho
- [ ] Cor do badge corresponde ao %
- [ ] Seção "Última Avaliação" aparece
- [ ] Data e avaliador aparecem
- [ ] Status resumido aparece
- [ ] Evidências (primeiras 100 chars) aparecem

**✅ Validar**:
- [ ] Dados salvam no banco
- [ ] Ao recarregar página, avaliação permanece
- [ ] Pode editar avaliação clicando novamente

---

### **TESTE 3: Salvar e Carregar PEI**

1. **Salvar como Rascunho**:
   - [ ] Clicar em "Salvar Rascunho"
   - [ ] Toast de sucesso
   - [ ] ID do PEI aparece na URL

2. **Recarregar Página**:
   - [ ] F5 ou recarregar manualmente
   - [ ] Todos os dados carregam:
     - [ ] Diagnóstico completo
     - [ ] Metas com avaliações
     - [ ] Recursos de acessibilidade
     - [ ] Avaliação do PEI
     - [ ] Feedback da família
     - [ ] Encaminhamentos

3. **Editar e Salvar Novamente**:
   - [ ] Modificar algum campo
   - [ ] Salvar
   - [ ] Verificar que mudança foi salva

**✅ Validar**:
- [ ] Nenhum dado é perdido
- [ ] evaluation_data salva corretamente
- [ ] Compatibilidade com PEIs antigos (sem evaluation_data)

---

### **TESTE 4: Fluxo Completo do Coordenador**

**Cenário**: Coordenador criando PEI completo

1. **Login como Coordenador**
2. **Dashboard** → "Criar Novo PEI"
3. **Preencher todas as 7 abas**
4. **Consultar adaptações automáticas**
5. **Avaliar pelo menos 2 metas**
6. **Preencher feedback da família**
7. **Salvar como Rascunho**
8. **Visualizar Relatório**
9. **Imprimir/PDF**

**✅ Validar**:
- [ ] Fluxo completo sem erros
- [ ] PDF contém todos os campos
- [ ] Layout profissional

---

### **TESTE 5: Responsividade Mobile**

1. **Abrir em dispositivo móvel** ou DevTools mobile view
2. **Testar todas as tabs**:
   - [ ] Tabs são visíveis (scroll horizontal se necessário)
   - [ ] Modal de avaliação responsivo
   - [ ] Cards de adaptações responsivos
   - [ ] Formulários usáveis em mobile

**✅ Validar**:
- [ ] Sem elementos cortados
- [ ] Touch funciona bem
- [ ] Texto legível

---

## 🎓 **GUIA DE TREINAMENTO PARA USUÁRIOS**

### **MÓDULO 1: Novos Campos do Diagnóstico** (10 min)

**Objetivo**: Ensinar a preencher os 3 novos campos

**Conteúdo**:
1. **Habilidades** 💪
   - O que é: Listar o que o aluno JÁ consegue fazer
   - Exemplos práticos
   - Por que é importante: Base para metas alcançáveis

2. **Aversões** ⚠️
   - O que é: Identificar gatilhos e situações desconfortáveis
   - Exemplos práticos
   - Por que é importante: Prevenir crises e adaptar ambiente

3. **Comentários sobre Barreiras** 💬
   - O que é: Contextualizar as barreiras com exemplos reais
   - Diferença entre marcar barreira e comentar
   - Exemplos de bons comentários

**Exercício Prático**:
- Abrir um caso real (sem identificação)
- Preencher os 3 campos em dupla
- Discutir respostas

---

### **MÓDULO 2: Avaliando Metas** (15 min)

**Objetivo**: Ensinar a avaliar metas sistematicamente

**Conteúdo**:
1. **Quando Avaliar**:
   - Periodicidade recomendada (mensal/bimestral)
   - Importância da avaliação contínua

2. **Como Usar o Slider**:
   - 0-24%: Necessita atenção (vermelho)
   - 25-49%: Progresso moderado (amarelo)
   - 50-74%: Bom progresso (azul)
   - 75-100%: Excelente progresso (verde)

3. **O Que São Evidências**:
   - Exemplos de boas evidências
   - Ser específico: datas, números, situações
   - Evitar generaliz ações

4. **Próximas Ações**:
   - Como definir próximos passos
   - Ser objetivo e viável
   - Vincular com as estratégias

**Exercício Prático**:
- Avaliar 2 metas de exemplo
- Preencher modal completo
- Feedback em grupo

---

### **MÓDULO 3: Consultando Adaptações Automáticas** (15 min)

**Objetivo**: Ensinar a usar a biblioteca de recomendações

**Conteúdo**:
1. **Diferença entre Adaptações e Estratégias**:
   - **Adaptações** (roxo): O que o PROFESSOR faz
   - **Estratégias** (verde): O que a ESCOLA/GESTÃO fornece

2. **10 Tipos de Barreiras**:
   - Apresentar cada tipo
   - Exemplos de cada

3. **Como Usar as Recomendações**:
   - Identificar barreiras no diagnóstico
   - Consultar aba "Adaptações"
   - Ler recomendações específicas
   - Adaptar para o contexto do aluno

4. **Exemplos Práticos**:
   - Mostrar para cada tipo de barreira
   - Discutir aplicabilidade

**Exercício Prático**:
- Cada participante escolhe uma barreira
- Consulta as recomendações
- Apresenta para o grupo como aplicaria

---

### **MÓDULO 4: Avaliação e Revisão do PEI** (15 min)

**Objetivo**: Ensinar a avaliar o PEI como um todo

**Conteúdo**:
1. **Datas de Revisão**:
   - Última revisão (histórico)
   - Revisão atual (hoje)
   - Próxima revisão (programar 3-6 meses)

2. **Progresso Geral**:
   - 4 níveis de progresso
   - Como avaliar globalmente
   - Diferença entre progresso das metas e progresso geral

3. **Feedback da Família** ⭐:
   - **Importância**: Valorizar a perspectiva familiar
   - Como registrar
   - Exemplos de bons feedbacks
   - **Aparece no relatório**: Card especial

4. **Ajustes Necessários**:
   - Identificar o que precisa mudar
   - Ser específico
   - Vincular com evidências

**Exercício Prático**:
- Simular reunião com família
- Registrar feedback
- Visualizar no relatório

---

### **MÓDULO 5: Relatório Completo** (10 min)

**Objetivo**: Apresentar o relatório final

**Conteúdo**:
1. **Nova Estrutura**:
   - 6 seções (+ comentários da família)
   - Formatação profissional
   - Logo institucional

2. **Seção Comentários da Família**:
   - Card destacado (azul)
   - Citação formatada
   - Data de registro

3. **Impressão/PDF**:
   - Como gerar
   - Qualidade profissional

**Exercício Prático**:
- Visualizar relatório completo
- Gerar PDF
- Feedback visual

---

## 📊 **CHECKLIST DE VALIDAÇÃO**

### **Funcionalidades Core**

- [ ] Criar novo PEI
- [ ] Salvar rascunho
- [ ] Carregar PEI existente
- [ ] Todas as 7 tabs navegáveis
- [ ] Dados persistem ao salvar

### **Novos Campos do Diagnóstico**

- [ ] Habilidades salva e carrega
- [ ] Aversões salva e carrega
- [ ] Comentários sobre barreiras salva e carrega
- [ ] Aparecem no relatório
- [ ] Aparecem no PDF

### **Avaliação de Metas**

- [ ] Modal abre e fecha
- [ ] Slider funciona (0-100%)
- [ ] Cores mudam dinamicamente
- [ ] Todos os campos salvam
- [ ] Resumo aparece no card
- [ ] Pode editar avaliação

### **Adaptações Automáticas**

- [ ] Lista de barreiras aparece
- [ ] Filtro por tipo funciona
- [ ] Tabs Adaptações/Estratégias funcionam
- [ ] Recomendações aparecem
- [ ] Exemplos aparecem
- [ ] Resumo consolidado aparece

### **Avaliação do PEI**

- [ ] Datas de revisão salvam
- [ ] Progresso geral funciona
- [ ] Cores/ícones dinâmicos
- [ ] Feedback da família salva
- [ ] Todos os campos persistem

### **Relatório**

- [ ] Todas as seções aparecem
- [ ] Comentários da família aparecem (quando preenchido)
- [ ] Formatação correta
- [ ] PDF gera corretamente

---

## 🐛 **PROBLEMAS CONHECIDOS E SOLUÇÕES**

### **Problema 1**: Tabs não aparecem todas em mobile
**Solução**: Scroll horizontal automático implementado

### **Problema 2**: Dados não salvam
**Causa**: Não clicou em "Salvar Rascunho"
**Solução**: Sempre salvar após edições

### **Problema 3**: Comentários da família não aparecem no relatório
**Causa**: Campo não foi preenchido
**Solução**: Preencher na aba "Avaliação"

---

## 📚 **MATERIAL DE APOIO**

1. **Vídeos de Treinamento** (a criar):
   - [ ] Tour completo das 7 abas
   - [ ] Como avaliar metas
   - [ ] Como usar adaptações automáticas
   - [ ] Como preencher feedback da família

2. **Documentos**:
   - ✅ MELHORIAS_PEI_COMPLETO.md
   - ✅ ✅_IMPLEMENTACAO_COMPLETA_INTERFACES.md
   - ✅ 🎉_SESSAO_COMPLETA_MELHORIAS_PEI.md

3. **FAQ** (a criar):
   - [ ] Perguntas frequentes
   - [ ] Soluções comuns

---

## 🎯 **METAS DE TREINAMENTO**

**Curto Prazo** (1 semana):
- [ ] Treinar coordenadores (2h)
- [ ] Treinar professores (2h)

**Médio Prazo** (1 mês):
- [ ] 100% dos coordenadores usando novos recursos
- [ ] 80% dos professores avaliando metas regularmente

**Longo Prazo** (3 meses):
- [ ] Feedback da família em 100% dos PEIs
- [ ] Adaptações automáticas consultadas regularmente

---

**✅ SISTEMA PRONTO PARA TESTES E TREINAMENTO!** 🚀


