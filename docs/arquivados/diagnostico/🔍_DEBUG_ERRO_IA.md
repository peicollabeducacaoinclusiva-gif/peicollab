# 🔍 DEBUG - ERRO AO GERAR COM IA

## ❌ **ERRO REPORTADO**

"Não foi possível gerar o Planejamento. Tente novamente."

---

## 🔧 **CORREÇÕES APLICADAS**

### **1. Melhor tratamento de erros no Frontend**

**Arquivo**: `src/components/pei/PlanningSection.tsx`

Agora o erro mostra mais detalhes e loga no console.

### **2. Melhor logging na Edge Function**

**Arquivo**: `supabase/functions/generate-pei-planning/index.ts`

Agora a edge function loga mais detalhes do erro.

---

## 🔍 **PARA DIAGNOSTICAR**

### **Passo 1: Ver o erro completo**

```bash
# 1. Abrir o browser em: http://localhost:8080
# 2. Pressionar F12 (abrir DevTools)
# 3. Ir na aba "Console"
# 4. Clicar em "Gerar com IA"
# 5. Copiar TODA a mensagem de erro que aparecer em vermelho
```

**Procure por**:
- `Error generating planning:`
- `Error details:`
- Qualquer mensagem em vermelho

### **Passo 2: Ver logs da Edge Function**

```bash
# No terminal onde rodou npm run dev
# Procurar por mensagens depois de clicar "Gerar com IA"
# Copiar qualquer erro que aparecer
```

---

## 🚀 **REINICIAR E TESTAR**

```bash
# 1. Parar o servidor atual
Ctrl + C

# 2. Reiniciar
npm run dev

# 3. Aguardar mensagens:
"  ➜  Local:   http://localhost:8080/"
"  ➜  Functions: http://127.0.0.1:54321/functions/v1/"

# 4. Acessar o sistema
http://localhost:8080

# 5. Login
coordinator@test.com / Coord@123

# 6. Abrir um PEI e clicar "Gerar com IA"
```

---

## 🎯 **POSSÍVEIS CAUSAS**

### **1. Edge Function não está rodando**
```bash
# Verificar se apareceu:
"Serving functions on http://127.0.0.1:54321/functions/v1/"
```

### **2. Timeout (demora muito)**
- OpenAI pode levar 30-60s para gerar
- Aumentar timeout se necessário

### **3. Erro na OpenAI**
- Chave inválida
- Limite de tokens
- Problema de rede

### **4. Erro de parsing do JSON**
- IA retornou JSON inválido
- Problema no regex de extração

---

## 💡 **TESTE MANUAL DA EDGE FUNCTION**

**Criar arquivo**: `test-edge-function.html`

```html
<!DOCTYPE html>
<html>
<body>
  <button onclick="testar()">Testar IA</button>
  <pre id="resultado"></pre>
  
  <script>
    async function testar() {
      try {
        document.getElementById('resultado').textContent = 'Chamando IA...';
        
        const response = await fetch('http://127.0.0.1:54321/functions/v1/generate-pei-planning', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            diagnosisData: {
              interests: 'Jogos, matemática, animais',
              specialNeeds: 'Leitura de palavras, atenção',
              history: 'Aluno com TEA, tranquilo, gosta de rotina',
              abilities: 'Reconhece letras, faz contas simples',
              barriers: [
                { barrier_type: 'Pedagógica', description: 'Dificuldade em leitura' },
                { barrier_type: 'Cognitiva', description: 'Atenção limitada' }
              ]
            }
          })
        });

        const data = await response.json();
        document.getElementById('resultado').textContent = JSON.stringify(data, null, 2);
        
      } catch (error) {
        document.getElementById('resultado').textContent = 'ERRO: ' + error.message;
      }
    }
  </script>
</body>
</html>
```

Abrir esse arquivo no browser e clicar no botão para testar diretamente.

---

## 📋 **ME ENVIE**

Para eu ajudar melhor, preciso ver:

1. **Erro completo do console** (F12 → Console)
2. **Logs do terminal** (onde rodou `npm run dev`)
3. **Mensagem de erro específica** que aparece

Com isso consigo identificar o problema exato!

---

**Por enquanto, reinicie o servidor e me envie os erros que aparecerem:**

```bash
npm run dev
```

