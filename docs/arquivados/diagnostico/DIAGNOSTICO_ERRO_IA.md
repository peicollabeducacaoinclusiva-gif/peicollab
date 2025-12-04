# 🔍 DIAGNÓSTICO - ERRO AO GERAR COM IA

## ❌ **PROBLEMA REPORTADO**

Usuário tentou usar o botão **"Gerar com IA"** no dashboard da coordenação e recebeu erro.

---

## 🔎 **LOCALIZAÇÃO DO BOTÃO**

**Arquivo**: `src/components/pei/PlanningSection.tsx`

**Linha**: 263

**Código**:
```typescript
<Button onClick={handleGenerateWithAI} disabled={generatingAI} variant="secondary">
  <Sparkles className="mr-2 h-4 w-4" />
  {generatingAI ? "Gerando..." : "Gerar com IA"}
</Button>
```

**Função chamada**:
```typescript
const handleGenerateWithAI = async () => {
  // Validação
  if (!diagnosisData.interests && !diagnosisData.specialNeeds && (!barriers || barriers.length === 0)) {
    toast({
      title: "Atenção",
      description: "Preencha pelo menos um campo da seção de diagnóstico antes de gerar o planejamento.",
      variant: "destructive",
    })
    return
  }

  try {
    setGeneratingAI(true)
    const { data, error } = await supabase.functions.invoke("generate-pei-planning", {
      body: { diagnosisData, barriers },
    })

    if (error) throw error

    onPlanningChange(data.planningData)
    toast({
      title: "Sucesso",
      description: "Planejamento gerado com IA!",
    })
  } catch (error) {
    console.error("Error generating planning:", error)
    toast({
      title: "Erro",
      description: "Não foi possível gerar o planejamento. Tente novamente.",
      variant: "destructive",
    })
  } finally {
    setGeneratingAI(false)
  }
}
```

---

## 🔧 **POSSÍVEIS CAUSAS DO ERRO**

### **1. Edge Function não implantada**
A edge function `generate-pei-planning` pode não estar implantada no Supabase.

**Verificar**:
```bash
# Listar functions implantadas
supabase functions list

# Implantar a function
supabase functions deploy generate-pei-planning
```

### **2. LOVABLE_API_KEY não configurada**
A edge function usa a Lovable AI, que precisa de uma chave API.

**Verificar**:
- Acessar: https://supabase.com/dashboard/project/fximylewmvsllkdczovj/settings/functions
- Verificar se existe a variável `LOVABLE_API_KEY`

### **3. Erro na Edge Function**
Pode haver erro no código da edge function.

**Arquivo**: `supabase/functions/generate-pei-planning/index.ts`

### **4. CORS ou Timeout**
- Timeout da function (padrão 10s)
- Problemas de CORS

---

## ✅ **SOLUÇÕES**

### **Solução 1: Usar OpenAI em vez de Lovable** ⭐ RECOMENDADO

Vou atualizar a edge function para usar OpenAI, que você forneceu a chave.

**Vantagens**:
- ✅ Chave OpenAI já fornecida
- ✅ Mais confiável
- ✅ Melhor qualidade
- ✅ Sem dependência da Lovable

### **Solução 2: Configurar Lovable API Key**

Se preferir usar Lovable:
1. Obter chave em: https://lovable.dev
2. Configurar no Supabase
3. Reimplantar function

### **Solução 3: Gerar Localmente**

Enquanto isso não funciona, pode usar templates prontos ou preencher manualmente.

---

## 🎯 **AÇÃO IMEDIATA**

Vou atualizar a edge function para usar **OpenAI** com a chave que você forneceu.

**Depois**:
```bash
# Implantar a edge function atualizada
supabase functions deploy generate-pei-planning --no-verify-jwt

# Ou reiniciar o servidor local
supabase functions serve
```

---

## 📝 **INFORMAÇÕES NECESSÁRIAS**

**Para ajudar melhor, preciso saber**:
1. Qual erro específico apareceu? (mensagem completa)
2. Está usando localhost ou produção?
3. Console do browser mostra algum erro?

**Como ver o erro no browser**:
1. F12 (abrir DevTools)
2. Aba "Console"
3. Tentar "Gerar com IA" novamente
4. Copiar mensagem de erro

---

**Vou atualizar a edge function agora para usar OpenAI!**

