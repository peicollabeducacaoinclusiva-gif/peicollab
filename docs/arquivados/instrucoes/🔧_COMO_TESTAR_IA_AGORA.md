# 🔧 COMO TESTAR A IA AGORA

## ✅ **EDGE FUNCTION CORRIGIDA**

A edge function foi atualizada para usar **OpenAI** (GPT-4o) com a chave que você forneceu.

---

## 🚀 **PASSO A PASSO**

### **1. Reiniciar o Servidor**

```bash
# Parar o servidor atual (se estiver rodando)
# Pressione: Ctrl + C

# Reiniciar
npm run dev
```

**Isso vai**:
- ✅ Recarregar a edge function com OpenAI
- ✅ Servir as functions localmente
- ✅ Aplicar todas as mudanças

---

### **2. Testar "Gerar com IA"**

```bash
# Já deve estar rodando após npm run dev
# Acessar: http://localhost:8080
```

**No navegador**:
1. Login: `coordinator@test.com` / `Coord@123`
2. Dashboard → Lista de PEIs
3. Clicar em "Editar" em um PEI
4. **Tab "Diagnóstico"**: Verificar que tem dados preenchidos
5. **Tab "Planejamento"**: Clicar **"Gerar com IA"** 🤖
6. Aguardar 20-40 segundos
7. Verificar se gerou as metas

---

## 🤖 **O QUE A IA VAI GERAR**

Quando clicar em "Gerar com IA":
- ✅ **NO MÍNIMO 3 METAS** SMART
- ✅ 2 acadêmicas (baseadas na BNCC)
- ✅ 2 funcionais (baseadas no AEE)
- ✅ Recursos de acessibilidade (2-3)
- ✅ Adequações curriculares completas
- ✅ Cronograma de intervenção
- ✅ Critérios de avaliação

**Tempo**: 20-40 segundos por geração

---

## 📊 **ESTRUTURA GERADA**

```json
{
  "goals": [
    {
      "category": "academic",
      "description": "Meta SMART detalhada",
      "target_date": "2025-08-31",
      "timeline": "medium_term",
      "specific_objectives": [...],
      "measurement_criteria": "...",
      "expected_outcomes": "...",
      "strategies": [...],
      "bncc_code": "EF15LP03"
    },
    // ... mais 2-7 metas
  ],
  "accessibilityResources": [...],
  "curriculumAdaptations": {...},
  "interventionSchedule": [...],
  "evaluationCriteria": {...}
}
```

Todos esses campos aparecerão automaticamente no formulário!

---

## ⚠️ **SE AINDA DER ERRO**

### **1. Verificar Console do Browser**:
```
F12 → Aba "Console" → Procurar erros em vermelho
```

### **2. Verificar se a function está rodando**:
```bash
# No terminal onde rodou npm run dev, procurar por:
"Serving functions on http://127.0.0.1:54321/functions/v1/"
```

### **3. Testar a function diretamente**:
Abrir em nova aba do browser:
```
http://127.0.0.1:54321/functions/v1/generate-pei-planning
```

Deve aparecer erro de método (normal), mas confirma que está rodando.

---

## 🎯 **FLUXO COMPLETO**

```
1. Usuario clica "Gerar com IA"
   ↓
2. Frontend chama edge function
   POST http://localhost:54321/functions/v1/generate-pei-planning
   Body: { diagnosisData: {...} }
   ↓
3. Edge function processa
   ├─ Monta prompt completo
   ├─ Chama OpenAI GPT-4o
   └─ Aguarda resposta (20-40s)
   ↓
4. OpenAI retorna JSON
   ├─ goals: [...]
   ├─ accessibilityResources: [...]
   ├─ curriculumAdaptations: {...}
   ├─ interventionSchedule: [...]
   └─ evaluationCriteria: {...}
   ↓
5. Edge function retorna para frontend
   ↓
6. Frontend atualiza o formulário
   ├─ Metas aparecem
   ├─ Recursos aparecem
   ├─ Adequações aparecem
   └─ Cronograma aparece
   ↓
7. Usuario revisa e salva
```

---

## ✅ **CHECKLIST**

- [x] Edge function atualizada para OpenAI
- [x] Chave da OpenAI configurada
- [x] Modelo: GPT-4o
- [x] max_tokens: 4000
- [x] Prompt completo mantido
- [ ] Servidor reiniciado (FAZER AGORA)
- [ ] Testar "Gerar com IA" (FAZER DEPOIS)

---

## 🎊 **PRÓXIMO PASSO**

**AGORA**:
```bash
npm run dev
```

**DEPOIS**:
Testar o botão "Gerar com IA" na interface!

---

**🚀 CORREÇÃO APLICADA! PRONTO PARA TESTAR! 🚀**


