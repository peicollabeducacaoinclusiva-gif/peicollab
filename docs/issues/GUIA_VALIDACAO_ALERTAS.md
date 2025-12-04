# Guia de Validação - Interface de Alertas

**Data**: Janeiro 2025  
**Componente**: `AttendanceAlertsDashboard`

---

## 📋 Checklist de Validação

### 1. Acesso à Página
- [ ] Acessar `/alerts` no navegador
- [ ] Verificar se a página carrega corretamente
- [ ] Verificar se há tabs visíveis

### 2. Tab "Frequência (75%)"
- [ ] Clicar na tab "Frequência (75%)"
- [ ] Verificar se o componente `AttendanceAlertsDashboard` é exibido
- [ ] Verificar se há mensagem de carregamento inicial

### 3. Estatísticas
- [ ] Verificar se os cards de estatísticas aparecem:
  - Total de Alertas
  - Críticos (<50%)
  - Alertas (50-74%)
- [ ] Verificar se os números estão corretos
- [ ] Verificar se os ícones aparecem

### 4. Gráfico de Distribuição
- [ ] Verificar se o gráfico de barras aparece
- [ ] Verificar se as cores estão corretas:
  - Verde para OK (≥75%)
  - Laranja para Alerta (50-74%)
  - Vermelho para Crítico (<50%)
- [ ] Verificar se os valores estão corretos

### 5. Filtros
- [ ] Testar filtro "Todos"
- [ ] Testar filtro "Críticos"
- [ ] Testar filtro "Alertas"
- [ ] Verificar se a lista é filtrada corretamente
- [ ] Verificar se os contadores são atualizados

### 6. Lista de Alertas
- [ ] Verificar se a lista de alunos aparece
- [ ] Verificar se cada card mostra:
  - Nome do aluno
  - Turma
  - Frequência percentual
  - Período (data início - data fim)
  - Status (badge)
- [ ] Verificar se os cards críticos têm borda vermelha
- [ ] Verificar se os cards de alerta têm borda laranja

### 7. Estado Vazio
- [ ] Verificar se aparece mensagem quando não há alertas
- [ ] Verificar se o ícone de "CheckCircle" aparece
- [ ] Verificar se a mensagem é clara

### 8. Botão Atualizar
- [ ] Clicar no botão "Atualizar"
- [ ] Verificar se os dados são recarregados
- [ ] Verificar se há feedback visual (loading)

### 9. Responsividade
- [ ] Testar em desktop (1920x1080)
- [ ] Testar em tablet (768x1024)
- [ ] Testar em mobile (375x667)
- [ ] Verificar se o layout se adapta corretamente

### 10. Performance
- [ ] Verificar tempo de carregamento inicial
- [ ] Verificar tempo de atualização
- [ ] Verificar se não há travamentos

---

## 🐛 Problemas Conhecidos

Nenhum problema conhecido no momento.

---

## 📝 Notas

- O componente usa a função RPC `get_students_below_attendance_threshold`
- O threshold padrão é 75%, mas pode ser ajustado
- Os alertas são calculados automaticamente via triggers no banco

---

## 🔧 Como Reportar Problemas

Se encontrar algum problema:

1. Anotar o passo exato onde ocorreu
2. Capturar screenshot (se possível)
3. Verificar console do navegador para erros
4. Verificar Network tab para chamadas de API
5. Reportar no issue tracker

---

**Última atualização**: Janeiro 2025

