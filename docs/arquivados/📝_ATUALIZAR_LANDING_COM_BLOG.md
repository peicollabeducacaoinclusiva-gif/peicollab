# 📝 COMO ATUALIZAR A LANDING PAGE COM O BLOG

**Data**: 10/11/2025

---

## 🎯 Objetivo

Adicionar o **Blog Educacional** à Landing Page, tornando-o o **6º aplicativo** do ecossistema PEI Colaborativo.

---

## 📍 Arquivo a Editar

```
apps/landing/src/pages/Home.tsx
```

---

## ✏️ Alterações Necessárias

### 1. Atualizar Hero Section

**Encontre:**
```tsx
<Badge className="mb-4">5 Aplicações Integradas</Badge>
<h1>Educação Inclusiva com Tecnologia</h1>
```

**Altere para:**
```tsx
<Badge className="mb-4">6 Aplicações Integradas</Badge>
<h1>Educação Inclusiva com Tecnologia</h1>
```

### 2. Atualizar Título da Seção de Produtos

**Encontre:**
```tsx
<h2>Cinco Aplicações, Uma Plataforma</h2>
```

**Altere para:**
```tsx
<h2>Seis Aplicações, Uma Plataforma</h2>
```

### 3. Adicionar Card do Blog

**Adicione após o card de "Atividades":**

```tsx
{
  title: 'Blog Educacional',
  description: 'Conteúdo sobre educação inclusiva, tutoriais e novidades do sistema.',
  icon: BookOpen,
  color: 'from-purple-500 to-pink-500',
  features: [
    'Artigos sobre inclusão',
    'Tutoriais do sistema',
    'Dicas para educadores',
    'Novidades e atualizações'
  ],
  link: 'http://localhost:5178',
  available: true
}
```

**Não esqueça de importar o ícone no topo do arquivo:**
```tsx
import { BookOpen } from 'lucide-react'
```

### 4. Atualizar Estatísticas

**Encontre:**
```tsx
{
  number: '5',
  label: 'Aplicações'
}
```

**Altere para:**
```tsx
{
  number: '6',
  label: 'Aplicações'
}
```

### 5. Atualizar Footer

**Na seção "Produtos" do footer, adicione:**

```tsx
<a href="http://localhost:5178" className="text-gray-600 hover:text-primary">
  Blog Educacional
</a>
```

---

## 📝 Exemplo Completo do Card

```tsx
const products = [
  {
    title: 'PEI Collab',
    description: 'Gestão completa de Planos Educacionais Individualizados.',
    icon: GraduationCap,
    color: 'from-blue-500 to-cyan-500',
    features: [
      'Criação colaborativa de PEIs',
      'Versionamento e aprovações',
      'Acompanhamento de metas',
      'Relatórios detalhados'
    ],
    link: 'http://localhost:8080',
    available: true
  },
  {
    title: 'Gestão Escolar',
    description: 'Administração completa da sua instituição de ensino.',
    icon: School,
    color: 'from-green-500 to-emerald-500',
    features: [
      'Gestão de alunos',
      'Gestão de profissionais',
      'Turmas e disciplinas',
      'Relatórios gerenciais'
    ],
    link: 'http://localhost:5174',
    available: true
  },
  {
    title: 'Plano de AEE',
    description: 'Planejamento de Atendimento Educacional Especializado.',
    icon: Users,
    color: 'from-orange-500 to-red-500',
    features: [
      'Planos de AEE estruturados',
      'Acompanhamento especializado',
      'Integração com PEI',
      'Gestão de recursos'
    ],
    link: 'http://localhost:5175',
    available: true
  },
  {
    title: 'Planejamento',
    description: 'Planejamento de aulas e sequências didáticas.',
    icon: Calendar,
    color: 'from-purple-500 to-indigo-500',
    features: [
      'Planejamento de aulas',
      'Sequências didáticas',
      'Alinhamento com BNCC',
      'Compartilhamento'
    ],
    link: 'http://localhost:5176',
    available: true
  },
  {
    title: 'Atividades',
    description: 'Banco de atividades pedagógicas inclusivas.',
    icon: FileText,
    color: 'from-pink-500 to-rose-500',
    features: [
      'Biblioteca de atividades',
      'Filtros por disciplina',
      'Atividades adaptadas',
      'Favoritos e avaliações'
    ],
    link: 'http://localhost:5177',
    available: true
  },
  {
    title: 'Blog Educacional',
    description: 'Conteúdo sobre educação inclusiva, tutoriais e novidades do sistema.',
    icon: BookOpen,
    color: 'from-purple-500 to-pink-500',
    features: [
      'Artigos sobre inclusão',
      'Tutoriais do sistema',
      'Dicas para educadores',
      'Novidades e atualizações'
    ],
    link: 'http://localhost:5178',
    available: true
  }
]
```

---

## 🎨 Preview do Card do Blog

O card terá:
- **Cor:** Gradiente roxo para rosa (`purple-500 to pink-500`)
- **Ícone:** BookOpen (livro aberto)
- **Link:** `http://localhost:5178`
- **Status:** Disponível ✅

---

## ✅ Checklist de Atualização

- [ ] Abrir `apps/landing/src/pages/Home.tsx`
- [ ] Importar ícone `BookOpen`
- [ ] Atualizar badge "5" → "6"
- [ ] Atualizar título "Cinco" → "Seis"
- [ ] Adicionar card do Blog
- [ ] Atualizar estatística "5" → "6"
- [ ] Adicionar link do Blog no footer
- [ ] Testar landing page (`npm run dev`)
- [ ] Verificar que todos os links funcionam

---

## 🚀 Testando

Após fazer as alterações:

```bash
# Terminal 1: Landing Page
cd apps/landing
npm run dev
# Acesse: http://localhost:3000

# Terminal 2: Blog
cd apps/blog
npm run dev
# Acesse: http://localhost:5178
```

---

## 📊 Estrutura Final dos Apps

| # | Aplicativo | Porta | Cor | Ícone |
|---|------------|-------|-----|-------|
| 1 | PEI Collab | 8080 | Azul → Ciano | GraduationCap |
| 2 | Gestão Escolar | 5174 | Verde → Esmeralda | School |
| 3 | Plano de AEE | 5175 | Laranja → Vermelho | Users |
| 4 | Planejamento | 5176 | Roxo → Índigo | Calendar |
| 5 | Atividades | 5177 | Rosa → Rosa Escuro | FileText |
| 6 | **Blog** | **5178** | **Roxo → Rosa** | **BookOpen** |

---

## 🎯 Resultado Esperado

Ao acessar a landing page, você deverá ver:
- ✅ Badge mostrando "6 Aplicações Integradas"
- ✅ Título "Seis Aplicações, Uma Plataforma"
- ✅ 6 cards de produtos (incluindo Blog)
- ✅ Card do Blog com gradiente roxo-rosa
- ✅ Estatística mostrando "6 Aplicações"
- ✅ Link do Blog no footer

---

**Documentado por**: Claude Sonnet 4.5  
**Data**: 10/11/2025  
**Status**: ✅ Pronto para aplicar

