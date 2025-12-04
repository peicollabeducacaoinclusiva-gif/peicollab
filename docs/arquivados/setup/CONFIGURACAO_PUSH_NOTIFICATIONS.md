# 🔔 Configuração de Notificações Push - PEI Collab

**Data:** 04 de Novembro de 2025  
**Status:** ✅ VAPID Keys Geradas

---

## 🔑 VAPID Keys Geradas

```env
VITE_VAPID_PUBLIC_KEY=9NRw65Eu9HTIOqTQ1Y2ZO3IP02LoWUiHLOtGCDe82nb69Wm8LxnBeNwV6RzkOjZtNQ3jwdubJ_yN2qrBy-eVwQQ

SUPABASE_VAPID_PRIVATE_KEY=FIm9qqCz9PZWoNWJ8dq5MQfj7CwF6hyGnqzVkgm1YcI
```

---

## 🚀 Passo 1: Configurar na Vercel

### 1.1. Adicionar Variável de Ambiente

1. Acesse: https://vercel.com/pei-collab/peicollab/settings/environment-variables
2. Adicione a variável:

```
Key:   VITE_VAPID_PUBLIC_KEY
Value: 9NRw65Eu9HTIOqTQ1Y2ZO3IP02LoWUiHLOtGCDe82nb69Wm8LxnBeNwV6RzkOjZtNQ3jwdubJ_yN2qrBy-eVwQQ
Environment: Production, Preview, Development
```

3. Clique em **Save**
4. Faça redeploy do projeto

---

## 📱 Passo 2: Testar Notificações Push

### 2.1. Sistema Já Está Preparado!

O PEI Collab já tem notificações implementadas em:
- ✅ Service Worker (`public/sw.js`)
- ✅ Notification Manager (`src/components/shared/NotificationManager.tsx`)
- ✅ Scripts de teste (`scripts/test-push-notifications.js`)

### 2.2. Testar Localmente

```bash
# 1. Configurar VAPID key local
echo "VITE_VAPID_PUBLIC_KEY=9NRw65Eu9HTIOqTQ1Y2ZO3IP02LoWUiHLOtGCDe82nb69Wm8LxnBeNwV6RzkOjZtNQ3jwdubJ_yN2qrBy-eVwQQ" >> .env.local

# 2. Reiniciar servidor
npm run dev

# 3. Testar notificação
npm run notifications:test
```

### 2.3. Testar em Produção

1. Acesse: https://www.peicollab.com.br/
2. Faça login como Coordinator
3. Clique no ícone de sino (notificações)
4. Permita notificações quando solicitado
5. Sistema enviará notificação de teste

---

## 🔔 Tipos de Notificações Implementadas

### 1. **PEI Submetido para Validação**
**Quando:** Professor submete PEI  
**Para:** Coordinator  
**Mensagem:** "Novo PEI aguardando validação de [Aluno]"

### 2. **PEI Aprovado**
**Quando:** Coordinator aprova PEI  
**Para:** Professor + Family  
**Mensagem:** "PEI de [Aluno] foi aprovado!"

### 3. **PEI Devolvido**
**Quando:** Coordinator devolve PEI  
**Para:** Professor  
**Mensagem:** "PEI de [Aluno] precisa de revisão"

### 4. **Novo Comentário**
**Quando:** Qualquer usuário comenta  
**Para:** Participantes do PEI  
**Mensagem:** "Novo comentário no PEI de [Aluno]"

### 5. **Token Familiar Gerado**
**Quando:** Coordinator gera token  
**Para:** Sistema (log)  
**Mensagem:** "Token de acesso familiar gerado"

### 6. **Família Aprovou PEI**
**Quando:** Família aprova via token  
**Para:** Professor + Coordinator  
**Mensagem:** "Família aprovou o PEI de [Aluno]!"

---

## 🧪 Script de Teste de Notificações

O sistema já inclui `scripts/test-push-notifications.js`:

```javascript
// Envia notificação de teste
// Verifica:
// - Service Worker ativo
// - Permissão concedida
// - Push recebido
// - Notification exibida
```

---

## 📊 Monitoramento de Notificações

### Métricas a Rastrear

1. **Taxa de Opt-in:** % de usuários que permitem notificações
2. **Taxa de Delivery:** % de notificações entregues
3. **Taxa de Click:** % de notificações clicadas
4. **Taxa de Dismiss:** % de notificações ignoradas

### Dashboard de Notificações

Criar visualização no Supabase:

```sql
-- Ver estatísticas de notificações
SELECT 
  notification_type,
  COUNT(*) as total_sent,
  COUNT(CASE WHEN delivered THEN 1 END) as delivered,
  COUNT(CASE WHEN clicked THEN 1 END) as clicked
FROM push_notifications
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY notification_type;
```

---

## ⚙️ Configurações Avançadas

### Personalização por Role

```typescript
// Diferentes configurações por perfil
const notificationSettings = {
  coordinator: {
    peiSubmitted: true,    // ✅ Notificar quando PEI é submetido
    peiComment: true,      // ✅ Notificar novos comentários
    familyApproval: true,  // ✅ Notificar aprovação familiar
    quietHours: false      // ❌ Notificar 24/7
  },
  teacher: {
    peiApproved: true,     // ✅ Notificar quando aprovado
    peiReturned: true,     // ✅ Notificar quando devolvido
    peiComment: true,      // ✅ Notificar comentários
    quietHours: true,      // ✅ Apenas horário comercial
    quietStart: '18:00',
    quietEnd: '08:00'
  },
  family: {
    peiUpdated: true,      // ✅ Atualização do PEI
    peiApproved: true,     // ✅ PEI aprovado
    peiComment: false,     // ❌ Sem comentários internos
    quietHours: true
  }
};
```

---

## 🎯 Próximos Passos

### Imediato
1. ✅ VAPID keys geradas
2. ⏳ Adicionar na Vercel (variável de ambiente)
3. ⏳ Redeploy com VAPID configurado

### Validação
4. ⏳ Testar em produção
5. ⏳ Verificar permissão de notificações
6. ⏳ Enviar notificação de teste
7. ⏳ Confirmar recebimento

### Otimização
8. ⏳ Configurar filtros por role
9. ⏳ Implementar quiet hours
10. ⏳ Dashboard de métricas de notificações

---

**Criado:** 04/11/2025 18:30  
**VAPID Keys:** ✅ Geradas  
**Próximo:** Adicionar na Vercel e testar

