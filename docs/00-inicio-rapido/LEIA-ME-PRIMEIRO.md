# 👋 Bem-vindo! Leia-me Primeiro

**Se você não é programador mas precisa manter este sistema, você está no lugar certo!**

---

## 🎯 Você Está Aqui Porque...

- ✅ Precisa fazer mudanças no sistema
- ✅ Vai usar IA (Inteligência Artificial) para ajudar
- ✅ Não tem experiência com programação
- ✅ Quer aprender fazendo

**Perfeito! Este guia foi feito para você. 🎉**

---

## 🚀 Comece Por Aqui

### Passo 1: Leia Este Guia (10 min)
Você está lendo agora. Continue! ✅

### Passo 2: Leia o Manual Completo (60 min)
→ [MANUAL_PROGRAMACAO_ASSISTIDA_IA.md](./MANUAL_PROGRAMACAO_ASSISTIDA_IA.md)

Este manual ensina:
- O que é o sistema
- Como está organizado
- Como pedir ajuda à IA
- O que NUNCA fazer
- Exemplos práticos

### Passo 3: Tenha o Cheatsheet à Mão (sempre)
→ [CHEATSHEET_PEDIDOS_IA.md](./CHEATSHEET_PEDIDOS_IA.md)

Use como "cola" quando for fazer algo.

---

## 💬 Como Funciona?

### Você não vai programar sozinho!

```
VOCÊ               →    IA              →    RESULTADO
(diz o que quer)   →    (implementa)   →    (código pronto)

Exemplo:
"Quero adicionar    →    IA cria o      →    Campo aparece
 campo telefone"         código               no formulário
```

### Seu Papel

✅ Decidir O QUÊ fazer  
✅ Descrever COMO deve funcionar  
✅ Testar se está correto  
✅ Entender o que foi feito  

❌ NÃO precisa escrever código  
❌ NÃO precisa decorar sintaxe  
❌ NÃO precisa saber tudo de programação  

---

## 🎓 O Que Você Precisa Saber (Mínimo)

### 1. **Estrutura Básica**

```
pei-collab/
├── apps/               → Aplicações (sistemas)
│   └── pei-collab/    → Sistema principal
│       └── src/
│           ├── pages/      → Telas (Dashboard, Login, etc)
│           ├── components/ → Partes reutilizáveis (Botão, Card)
│           └── services/   → Lógica de negócio
│
├── supabase/          → Banco de dados
└── docs/              → Documentação (você está aqui)
```

### 2. **Comandos Básicos** (Terminal)

```bash
# Rodar o sistema
pnpm dev

# Testar
pnpm test

# Ver se tem erros
pnpm lint
```

### 3. **Segurança (IMPORTANTE!)**

❌ **NUNCA desabilite RLS** (proteção do banco de dados)  
❌ **NUNCA modifique PEI aprovado**  
❌ **NUNCA delete dados sem backup**  

✅ **SEMPRE use funções RPC** (para acessar dados)  
✅ **SEMPRE teste** após mudanças  
✅ **SEMPRE peça** validação de segurança à IA  

---

## 🎯 Seu Primeiro Dia

### Manhã: Configuração (2 horas)

1. **Instalar ferramentas:**
   - Node.js
   - pnpm
   - VS Code (editor de código)

2. **Baixar o projeto:**
   ```bash
   git clone [URL]
   cd pei-collab
   pnpm install
   ```

3. **Rodar pela primeira vez:**
   ```bash
   pnpm dev
   ```
   Abra: http://localhost:8080

### Tarde: Primeira Mudança (2 horas)

1. **Escolha algo simples:**
   - Mudar um texto
   - Mudar uma cor

2. **Use o cheatsheet**

3. **Peça à IA:**
   ```
   "Quero mudar o texto 'Bem-vindo' para 'Olá' no Dashboard.
   Pode fazer isso?"
   ```

4. **Teste:**
   - Recarregue a página
   - Veja se mudou
   - Se funcionou, parabéns! 🎉

---

## 🆘 Se Algo Der Errado

### NÃO entre em pânico!

1. **Copie o erro completo**
2. **Pergunte à IA:**
   ```
   "Deu este erro:
   [COLE O ERRO]
   
   Pode corrigir?"
   ```

3. **Se não resolver, restaure:**
   ```bash
   git restore .
   ```

---

## 📚 Recursos

### Dentro do Projeto
- [Índice de Documentação](../INDICE_DOCUMENTACAO.md)
- [Análise do Projeto](../06-analises-avaliacoes/ANALISE_COMPLETA.md)
- [Guia de Desenvolvimento](../desenvolvimento/README.md)

### Suas "Colas"
1. [Manual Completo](./MANUAL_PROGRAMACAO_ASSISTIDA_IA.md) - Quando precisa entender
2. [Guia Prático](./GUIA_PRATICO_IA.md) - Quando precisa exemplos
3. [Cheatsheet](./CHEATSHEET_PEDIDOS_IA.md) - Quando precisa fazer rápido

---

## 💪 Você Consegue!

Milhares de pessoas sem experiência em programação estão mantendo sistemas complexos usando IA.

**A chave é:**
- Ser claro nos pedidos
- Testar tudo
- Aprender com cada mudança
- Não ter medo de perguntar

---

## 🎯 Próximo Passo

**Agora vá para:** [Manual Completo](./MANUAL_PROGRAMACAO_ASSISTIDA_IA.md)

Leia com calma, pratique os exemplos e em breve estará desenvolvendo com confiança!

---

**Criado especialmente para você** 💙  
**Janeiro 2025**

