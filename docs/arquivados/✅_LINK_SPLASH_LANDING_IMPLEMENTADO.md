# ✅ Link Splash → Landing Implementado com Sucesso

## 📋 O que foi implementado

Adicionado link do Splash do PEI Collab para a Landing Page institucional, permitindo que usuários acessem informações completas sobre o projeto.

## 🎯 Localização dos Links

### 1. Header (Linha ~252-259)
```typescript
<Button
  onClick={() => window.open(LANDING_URL, '_blank')}
  variant="outline"
  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold hidden md:flex items-center gap-2"
>
  <Globe className="w-4 h-4" />
  Sobre o Projeto
</Button>
```

**Características:**
- Visível apenas em telas médias/grandes (`hidden md:flex`)
- Estilo outline discreto
- Ícone de globo (Globe)
- Não compete com o CTA principal "Acesso ao PEI Collab"

### 2. Footer - Seção Produto (Linha ~684-689)
```typescript
<li 
  onClick={() => window.open(LANDING_URL, '_blank')}
  className="hover:text-white transition-colors cursor-pointer"
>
  Sobre o Projeto
</li>
```

**Características:**
- Primeiro item da lista "Produto"
- Hover effect consistente com outros itens
- Sempre visível

## ⚙️ Configuração

### Constante LANDING_URL (Linha ~7)
```typescript
const LANDING_URL = import.meta.env.VITE_LANDING_URL || 'http://localhost:5174';
```

### Variável de Ambiente
Criar arquivo `.env` em `apps/pei-collab/`:

```bash
# Desenvolvimento
VITE_LANDING_URL=http://localhost:5174

# Produção (exemplo)
VITE_LANDING_URL=https://landing.peicollab.com
```

## 🎨 Design

- **Cor**: Indigo (consistente com o tema do projeto)
- **Comportamento**: Abre em nova aba (`_blank`)
- **UX**: Não interrompe a navegação do usuário no PEI Collab
- **Acessibilidade**: Cursor pointer e feedback visual no hover

## 📁 Arquivos Modificados

1. **`apps/pei-collab/src/pages/Splash.tsx`**
   - Adicionado import `Globe` de lucide-react
   - Criada constante `LANDING_URL`
   - Adicionado botão no header
   - Adicionado link no footer

2. **`apps/pei-collab/LANDING_CONFIG.md`** _(novo)_
   - Documentação de configuração

## ✅ Validação

- ✅ Sem erros de lint
- ✅ TypeScript types corretos
- ✅ Design responsivo
- ✅ UX não intrusiva
- ✅ Configuração flexível (dev/prod)

## 🚀 Próximos Passos (Opcional)

1. Definir URL de produção da landing
2. Configurar variável de ambiente no deploy
3. Testar navegação entre apps em produção
4. Considerar adicionar links semelhantes nos outros apps (gestao-escolar, plano-aee, etc.)

## 📝 Notas

- URL padrão: `http://localhost:5174` (porta típica da landing em dev)
- Links abrem em nova aba para preservar contexto do usuário
- Botão do header escondido em mobile para economizar espaço
- Footer sempre mostra o link em todas as resoluções

