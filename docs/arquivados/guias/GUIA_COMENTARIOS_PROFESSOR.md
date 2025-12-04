# 💬 GUIA RÁPIDO: Como o Professor Comenta no PEI

## 📍 **Passo a Passo Visual**

### **1️⃣ Entre no Dashboard**
```
Login como Professor → Você verá o Dashboard
```

### **2️⃣ Localize seus PEIs**
```
Dashboard → Aba "Visão Geral" → Seção "Meus PEIs"

Você verá uma tabela com seus PEIs:
┌──────────────────────────────────────────────────┐
│ Aluno         │ Status     │ Comentários │ Ações │
├──────────────────────────────────────────────────┤
│ Débora Lima   │ 🟡 Rascun. │    [2] 💬   │ 👁️ ✏️ │
│ Carlos Silva  │ ✅ Aprovado │    [5] 💬   │ 👁️ ✏️ │
└──────────────────────────────────────────────────┘
                                              ↑
                                    Clique aqui (👁️)
```

### **3️⃣ Clique no Ícone de Visualizar (👁️)**
```
Dialog abre com:
├─ 📄 Conteúdo completo do PEI
├─ ─────────────────────────────
└─ 💬 Comentários e Colaboração ← ROLE ATÉ AQUI!
```

### **4️⃣ Na Seção de Comentários**
```
┌─ Adicionar Comentário ──────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │ Compartilhe suas observações,           │ │
│ │ sugestões ou dúvidas sobre este PEI...  │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                    [💬 Enviar Comentário]   │
└─────────────────────────────────────────────┘
          ↑
    Digite aqui!
```

### **5️⃣ Digite e Envie**
```
1. Digite sua observação/sugestão/dúvida
2. Clique "Enviar Comentário"
3. ✅ Toast: "Comentário adicionado com sucesso!"
4. Comentário aparece na lista abaixo
```

### **6️⃣ Veja os Comentários**
```
┌─ João Silva · 05/11/2025 às 14:30 ──────────┐
│ Observei ótimo progresso em leitura.        │
│ Sugiro reforçar interpretação de texto.     │
└──────────────────────────────────────────────┘

┌─ Maria Santos · 04/11/2025 às 16:20 ────────┐
│ Em Matemática ainda precisa de apoio        │
│ visual. Vou usar materiais concretos.       │
└──────────────────────────────────────────────┘

┌─ Família · 03/11/2025 às 19:45 ─────────────┐
│ [Família] Em casa ele está mais motivado.   │
│ Obrigada pelo trabalho de vocês!            │
└──────────────────────────────────────────────┘
```

---

## 🎯 **Casos de Uso dos Comentários**

### **1. Comunicação entre Professores**
```
Professor de Português → comenta sobre leitura
Professor de Matemática → vê e responde sobre números
Professor AEE → sugere adaptações específicas
```

### **2. Orientação do Coordenador**
```
Coordenador → orienta sobre estratégias
Professores → confirmam que entenderam
Coordenador → aprova PEI com base nas discussões
```

### **3. Feedback da Família**
```
Família → compartilha observações de casa
Professores → ajustam estratégias baseado no feedback
Sistema → mais alinhado com realidade do aluno
```

### **4. Documentação de Evolução**
```
Professor → "Tentei estratégia X"
2 semanas depois → "Funcionou! Aluno melhorou em Y"
Coordenador → "Vamos aplicar em outros casos similares"
```

---

## ⚡ **Recursos da Interface**

### ✅ **Campo de Comentário**
- Destaque visual (borda azul, fundo claro)
- Placeholder descritivo
- 3 linhas de altura
- Redimensionável
- Desabilitado durante envio

### ✅ **Botão de Enviar**
- Desabilitado se campo vazio
- Loading state durante envio
- Ícone de mensagem
- Feedback imediato

### ✅ **Lista de Comentários**
- Ordenados do mais recente para o mais antigo
- Avatar com iniciais do autor
- Nome completo do autor
- Data e hora formatada (dd/MM/yyyy às HH:mm)
- Conteúdo preserva quebras de linha
- Borda lateral colorida por tipo

### ✅ **Estado Vazio**
- Mensagem amigável
- Ícone ilustrativo
- Convida a ser o primeiro

---

## 🔔 **Notificações**

### **No Dashboard:**
```
Aluno           │ Status    │ Comentários │
────────────────┼───────────┼─────────────┤
Débora Lima     │ Rascunho  │  [2] 💬     │ ← Número de comentários
                                   ↑
                        Se há não lidos:
                            [2] 💬 com badge vermelho
```

### **Na Timeline:**
```
🕒 Timeline de Atividades
├─ 💬 Novo comentário de Maria Santos
│   "Concordo com a abordagem..."
│   Há 2 horas • PEI: Débora Lima
│
├─ ✏️ PEI atualizado
│   Carlos Silva
│   Ontem
```

---

## 📱 **Responsividade**

A interface funciona em:
- ✅ Desktop (dialog largo)
- ✅ Tablet (dialog médio)
- ✅ Mobile (dialog em tela cheia)

---

## 🎨 **Customizações**

### **Avatar do Comentário:**
- Cores diferentes por perfil
- Iniciais do nome
- Fallback para "Família" se sem user_id

### **Formatação:**
```typescript
// Data formatada
format(new Date(comment.created_at), 
  "dd/MM/yyyy 'às' HH:mm", 
  { locale: ptBR }
)

// Exemplo: "05/11/2025 às 14:30"
```

### **Preservação de Quebras de Linha:**
```typescript
<p className="whitespace-pre-wrap">
  {comment.content}
</p>
```
Comentários com múltiplas linhas são preservados!

---

## ❓ **Perguntas Frequentes**

### **P: Posso editar um comentário depois de enviar?**
R: Não. Para auditoria, comentários são imutáveis.

### **P: Posso deletar um comentário?**
R: Apenas administradores via banco de dados (emergências).

### **P: A família vê meus comentários?**
R: Não! Família só vê o PEI e pode comentar, mas não vê discussões internas.

### **P: Quanto tempo ficam os comentários?**
R: Permanentemente, fazem parte do histórico do PEI.

### **P: Tem limite de tamanho?**
R: Tecnicamente não, mas mantenha conciso e relevante.

### **P: Posso anexar arquivos?**
R: Atualmente não. Versão futura pode incluir.

---

## 🔄 **Próximas Melhorias Planejadas**

1. **Notificações em Tempo Real**
   - WebSocket para atualização automática
   - Som quando novo comentário chega

2. **Menções**
   - @nomeprofessor para notificar diretamente
   - Autocomplete de nomes

3. **Anexos**
   - Fotos, PDFs, documentos
   - Galeria de anexos

4. **Filtros**
   - Por autor
   - Por data
   - Só não lidos

5. **Respostas (Threading)**
   - Comentário → Resposta → Sub-resposta
   - Discussões organizadas

---

## ✅ **Checklist de Teste**

Use este checklist para testar a funcionalidade:

- [ ] Login como Professor
- [ ] Vejo meus PEIs no dashboard
- [ ] Vejo contador de comentários em cada PEI
- [ ] Clico no ícone 👁️ de visualizar
- [ ] Dialog abre mostrando o PEI completo
- [ ] Rolo até o final e vejo "Comentários e Colaboração"
- [ ] Vejo comentários existentes (se houver)
- [ ] Campo de texto está presente e focável
- [ ] Digito um comentário de teste
- [ ] Botão "Enviar Comentário" está habilitado
- [ ] Clico em "Enviar"
- [ ] Toast de sucesso aparece
- [ ] Comentário aparece na lista
- [ ] Meu nome aparece como autor
- [ ] Data/hora estão corretas
- [ ] Posso adicionar outro comentário
- [ ] Contador atualiza no dashboard

---

**Tudo pronto!** 🎉

**Próximo passo:** Teste a funcionalidade e me avise se funciona! 🚀

