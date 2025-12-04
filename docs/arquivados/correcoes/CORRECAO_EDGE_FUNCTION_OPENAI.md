# 🔧 CORREÇÃO - EDGE FUNCTION PARA OPENAI

## ✅ **PROBLEMA IDENTIFICADO E CORRIGIDO**

**Problema**: Edge function estava configurada para usar **Lovable AI**, que não está configurada ou sem créditos.

**Solução**: Atualizar para usar **OpenAI** com a chave fornecida.

---

## 🔧 **ALTERAÇÕES FEITAS**

**Arquivo**: `supabase/functions/generate-pei-planning/index.ts`

### **Antes** (Lovable AI):
```typescript
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    // ...
  }),
});
```

### **Agora** (OpenAI):
```typescript
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || 
  'sk-proj-[REMOVIDO]wYJyNJUvG8JIjtC5QTVo75J7bSoLod7JfT5v4kdFKOxk6j2ptt9JX8LXLWAmiWaew9vo0tpEABT3BlbkFJKJ7clkfIePe6u40LEL5oqbD_OuyTwa54vWz41l1CYBYE4DtWD62dlNUHjROOLsGVapRGoCuIcA';

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    max_tokens: 4000,
    // ...
  }),
});
```

---

## 🚀 **PRÓXIMOS PASSOS**

### **Se estiver usando LOCALMENTE** (localhost:8080):

```bash
# 1. Parar o servidor atual (Ctrl+C se estiver rodando)

# 2. Reiniciar com as edge functions
npm run dev

# A edge function local será recarregada automaticamente
```

### **Se estiver em PRODUÇÃO** (Vercel):

```bash
# 1. Implantar a edge function atualizada
supabase functions deploy generate-pei-planning --project-ref fximylewmvsllkdczovj

# 2. (Opcional) Configurar variável de ambiente no Supabase
# Acessar: https://supabase.com/dashboard/project/fximylewmvsllkdczovj/settings/functions
# Adicionar: OPENAI_API_KEY = sk-proj-[REMOVIDO]wYJyNJUvG8JIjtC5QTVo75J7bSoLod7JfT5v4kdFKOxk6j2ptt9JX8LXLWAmiWaew9vo0tpEABT3BlbkFJKJ7clkfIePe6u40LEL5oqbD_OuyTwa54vWz41l1CYBYE4DtWD62dlNUHjROOLsGVapRGoCuIcA
```

---

## ✅ **O QUE MUDOU**

### **API Provider**:
- ❌ Lovable AI (sem configuração)
- ✅ OpenAI (com chave fornecida)

### **Modelo**:
- ❌ `google/gemini-2.5-flash`
- ✅ `gpt-4o` (mais poderoso)

### **Endpoint**:
- ❌ `https://ai.gateway.lovable.dev/v1/chat/completions`
- ✅ `https://api.openai.com/v1/chat/completions`

### **Configuração**:
- ✅ Chave hardcoded como fallback
- ✅ max_tokens: 4000 (para respostas completas)
- ✅ Mesmas instruções e prompt

---

## 🧪 **TESTAR AGORA**

```bash
# Reiniciar servidor
npm run dev
```

**Depois**:
1. Acessar `http://localhost:8080`
2. Login: `coordinator@test.com` / `Coord@123`
3. Abrir um PEI
4. Tab "Planejamento"
5. Clicar **"Gerar com IA"** 🤖
6. Aguardar 20-30 segundos
7. Verificar se gera as metas

---

## 🎯 **O QUE A IA VAI GERAR**

Com a nova configuração OpenAI:
- ✅ NO MÍNIMO 3 METAS SMART
- ✅ 2-3 Recursos de acessibilidade
- ✅ Adequações curriculares
- ✅ Cronograma de intervenção
- ✅ Critérios de avaliação

---

## 💡 **SE AINDA DER ERRO**

1. **Verificar console do browser** (F12 → Console)
2. **Verificar logs da edge function**:
   ```bash
   supabase functions logs generate-pei-planning --project-ref fximylewmvsllkdczovj
   ```
3. **Testar a edge function diretamente**:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/generate-pei-planning \
     -H "Content-Type: application/json" \
     -d '{"diagnosisData": {"interests": "jogos", "specialNeeds": "leitura", "barriers": []}}'
   ```

---

**✅ CORREÇÃO APLICADA! Reinicie o servidor e teste novamente!** 🚀

