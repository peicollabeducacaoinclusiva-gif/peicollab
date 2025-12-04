# 🎨 Sistema de Avatars com Emojis

## 📋 Implementação

Sistema leve e moderno de avatars usando emojis personalizáveis, sem necessidade de upload de imagens.

---

## ✨ Características

✅ **Sem armazenamento de imagens** - Usa emojis nativos  
✅ **Cores personalizáveis** - 11 opções de cores  
✅ **Emojis padrão por role** - Configuração automática  
✅ **40+ emojis disponíveis** - Educadores, gestão, disciplinas, etc.  
✅ **Leve e rápido** - Sem uploads ou processamento de imagem  

---

## 🎭 Emojis Padrão por Perfil

| Perfil | Emoji | Cor |
|--------|-------|-----|
| Superadmin | 👑 | Roxo |
| Secretário de Educação | 🎓 | Índigo |
| Diretor Escolar | 🏫 | Azul |
| Coordenador | 📋 | Verde |
| Professor | 👨‍🏫 | Azul-esverdeado |
| Professor AEE | ♿ | Ciano |
| Especialista | 🩺 | Rosa |
| Família | 👨‍👩‍👧 | Laranja |

---

## 📁 Arquivos Criados

### 1. **Migração do Banco**
`supabase/migrations/20250203000006_add_profile_avatars.sql`

**Alterações:**
- ✅ Campo `avatar_emoji` (VARCHAR 10)
- ✅ Campo `avatar_color` (VARCHAR 20)
- ✅ Função `update_user_avatar()`
- ✅ Trigger para novos usuários
- ✅ Atualização de usuários existentes

### 2. **Componentes React**

**`src/components/shared/EmojiAvatarPicker.tsx`**
- Seletor de emoji e cor
- Preview em tempo real
- 40+ emojis em 4 categorias
- 11 opções de cores

**`src/components/shared/UserAvatar.tsx`**
- Componente reutilizável
- Mostra emoji ou iniciais (fallback)
- 4 tamanhos: sm, md, lg, xl
- Suporte a cores personalizadas

### 3. **Página de Perfil Atualizada**
`src/pages/Profile.tsx`
- ✅ Mostra avatar com emoji
- ✅ Botão "Personalizar Avatar"
- ✅ Salva automaticamente no banco

---

## 🎨 Categorias de Emojis

### Educadores (5)
👨‍🏫 👩‍🏫 🧑‍🏫 👨‍🎓 👩‍🎓

### Gestão (5)
👑 🎓 🏫 📋 📊

### Especialistas (5)
♿ 🩺 👨‍⚕️ 👩‍⚕️ 🧠

### Família (4)
👨‍👩‍👧 👨‍👩‍👧‍👦 👪 💑

### Disciplinas (13)
📚 📖 ✏️ 🔢 🔬 🌍 🗺️ 🎨 🎵 ⚽ 🏃 💻 🌐

### Outros (5)
🌟 💙 🎯 🚀 ✨

---

## 🎨 Cores Disponíveis

| Cor | Classe CSS | Uso Sugerido |
|-----|-----------|--------------|
| Azul | `bg-blue-500` | Padrão |
| Verde | `bg-green-500` | Coordenação |
| Roxo | `bg-purple-500` | Administração |
| Laranja | `bg-orange-500` | Família |
| Rosa | `bg-pink-500` | Especialistas |
| Azul-esverdeado | `bg-teal-500` | Professores |
| Índigo | `bg-indigo-500` | Gestores |
| Vermelho | `bg-red-500` | Alertas |
| Amarelo | `bg-yellow-500` | Destaques |
| Ciano | `bg-cyan-500` | AEE |
| Cinza | `bg-gray-500` | Neutro |

---

## 🚀 Como Usar

### Para Usuários (Frontend)

1. **Ir para Perfil**
   - Clicar no nome/avatar no header
   - Ou acessar `/profile`

2. **Personalizar Avatar**
   - Clicar em "Personalizar Avatar"
   - Escolher emoji da lista
   - Escolher cor de fundo
   - Ver preview em tempo real
   - Clicar em "Salvar Avatar"

3. **Resultado**
   - Avatar atualizado em todo o sistema!
   - Aparece em: dashboards, listas, comentários, notificações

### Para Desenvolvedores

**Usar o componente `UserAvatar`:**

```tsx
import UserAvatar from '@/components/shared/UserAvatar';

<UserAvatar
  emoji={user.avatar_emoji}
  color={user.avatar_color}
  fallbackName={user.full_name}
  size="md"
/>
```

**Tamanhos disponíveis:**
- `sm` - 32x32px (listas, tabelas)
- `md` - 48x48px (cards, padrão)
- `lg` - 64x64px (destaque)
- `xl` - 96x96px (perfil, hero)

---

## 💾 Estrutura do Banco

### Tabela `profiles`

```sql
avatar_emoji VARCHAR(10) DEFAULT '👤'
avatar_color VARCHAR(20) DEFAULT 'blue'
```

### Função SQL

```sql
-- Atualizar avatar
SELECT update_user_avatar(
  'user-id',
  '👨‍🏫',  -- emoji
  'teal'   -- cor
);
```

---

## 🔄 Migração de Usuários Existentes

A migração automaticamente:

1. ✅ Adiciona campos `avatar_emoji` e `avatar_color`
2. ✅ Define emoji padrão baseado no role de cada usuário
3. ✅ Configura trigger para novos usuários
4. ✅ Atualiza todos os perfis existentes

**Não precisa fazer nada manual!** 🎉

---

## 📊 Onde Aparece

O avatar com emoji aparece em:

✅ **Página de Perfil** - Grande, com opção de editar  
✅ **Header** - Pequeno, ao lado do nome  
✅ **Dashboards** - Cards de usuários/professores  
✅ **Listas de PEIs** - Identificação visual  
✅ **Comentários** - Avatar do autor  
✅ **Notificações** - Avatar relacionado  
✅ **Tabelas** - Identificação rápida  

---

## 🎯 Benefícios

### Para Usuários
✅ Personalização rápida e fácil  
✅ Identificação visual imediata  
✅ Sem necessidade de foto  
✅ Privacidade (não usa foto real)  

### Para o Sistema
✅ Zero armazenamento de imagens  
✅ Performance excelente  
✅ Compatível com qualquer dispositivo  
✅ Sem custo de CDN ou storage  
✅ Acessibilidade (emojis têm bom suporte)  

---

## 🔧 Manutenção

### Adicionar Novo Emoji

Editar: `src/components/shared/EmojiAvatarPicker.tsx`

```tsx
const EMOJI_OPTIONS: EmojiOption[] = [
  // ... emojis existentes
  { emoji: "🦄", label: "Unicórnio", category: "Outros" },
];
```

### Adicionar Nova Cor

```tsx
const COLOR_OPTIONS: ColorOption[] = [
  // ... cores existentes
  { value: "lime", label: "Lima", className: "bg-lime-500" },
];
```

---

## 🆘 Troubleshooting

### Emoji não aparece

**Causa**: Navegador ou SO não suporta o emoji específico  
**Solução**: Escolher emoji mais comum (👤, 👨‍🏫, 📋, etc.)

### Cor não muda

**Causa**: Classes do Tailwind não estão sendo geradas  
**Solução**: Garantir que as cores estão no `safelist` do Tailwind (já configurado)

### Avatar mostra iniciais em vez de emoji

**Causa**: Campo `avatar_emoji` está vazio ou é '👤'  
**Solução**: Personalizar avatar na página de perfil

---

## 📖 Referências

- **Migração**: `supabase/migrations/20250203000006_add_profile_avatars.sql`
- **Picker**: `src/components/shared/EmojiAvatarPicker.tsx`
- **Avatar**: `src/components/shared/UserAvatar.tsx`
- **Perfil**: `src/pages/Profile.tsx`

---

**Status**: ✅ Pronto para uso!  
**Próximo**: Aplicar migração e personalizar avatars! 🎉
































