# 📝 Blog Educacional - PEI Colaborativo

Blog educacional do sistema PEI Colaborativo, focado em educação inclusiva e compartilhamento de conhecimento.

## 🎯 Sobre

O **Blog Educacional** é um aplicativo web desenvolvido para que o administrador do sistema possa publicar conteúdo sobre:

- 📚 Educação inclusiva
- 🎓 Sistema PEI Colaborativo
- 💡 Tutoriais e guias práticos
- 🆕 Novidades e atualizações
- ✨ Dicas e boas práticas

## ✨ Funcionalidades

### Para Visitantes (Público)
- ✅ Visualizar posts publicados
- ✅ Buscar posts por título/conteúdo
- ✅ Filtrar por categoria
- ✅ Visualização de post completo
- ✅ Contador de visualizações

### Para Administradores
- ✅ Criar novos posts com editor rich text
- ✅ Editar posts existentes
- ✅ Excluir posts
- ✅ Publicar/despublicar posts
- ✅ Organizar por categorias
- ✅ Upload de imagens de capa
- ✅ Dashboard com estatísticas
- ✅ Preview antes de publicar

## 🛠️ Tecnologias

- **Framework:** React 18 + TypeScript
- **Roteamento:** React Router DOM
- **Estilização:** Tailwind CSS
- **Editor:** React Quill (rich text editor)
- **Backend:** Supabase
- **Ícones:** Lucide React
- **Build:** Vite

## 🚀 Como Executar

### Pré-requisitos

1. Node.js instalado
2. Supabase configurado
3. Migrações do banco aplicadas

### Instalação

```bash
# Na raiz do projeto
cd apps/blog

# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

O app estará disponível em: `http://localhost:5178`

## 📁 Estrutura de Arquivos

```
apps/blog/
├── src/
│   ├── components/
│   │   ├── Header.tsx          # Cabeçalho do site
│   │   ├── Footer.tsx          # Rodapé do site
│   │   └── PostCard.tsx        # Card de preview do post
│   ├── pages/
│   │   ├── Home.tsx            # Lista de posts (público)
│   │   ├── PostView.tsx        # Visualização de post (público)
│   │   ├── Login.tsx           # Login de admin
│   │   ├── Dashboard.tsx       # Dashboard admin
│   │   ├── CreatePost.tsx      # Criar novo post
│   │   └── EditPost.tsx        # Editar post
│   ├── lib/
│   │   ├── supabase.ts         # Cliente Supabase + tipos
│   │   └── utils.ts            # Funções utilitárias
│   ├── App.tsx                 # Rotas principais
│   ├── main.tsx               # Entry point
│   └── index.css              # Estilos globais
├── public/                     # Assets públicos
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

## 🗄️ Banco de Dados

### Tabelas

#### `blog_categories`
- `id` - UUID (PK)
- `name` - Nome da categoria
- `slug` - URL amigável
- `description` - Descrição
- `created_at` - Data de criação

#### `blog_posts`
- `id` - UUID (PK)
- `title` - Título do post
- `slug` - URL amigável
- `excerpt` - Resumo
- `content` - Conteúdo HTML
- `cover_image` - URL da imagem de capa
- `category_id` - FK para categoria
- `author_id` - FK para auth.users
- `published` - Boolean
- `published_at` - Data de publicação
- `views` - Contador de visualizações
- `created_at` - Data de criação
- `updated_at` - Data de atualização

### Aplicar Migrações

```bash
# No diretório raiz do projeto
# Aplique a migração
supabase db push

# Ou execute o SQL diretamente no Supabase Dashboard
```

### Inserir Posts de Exemplo

```bash
# Execute o script SQL
psql -f CRIAR_POSTS_EXEMPLO_BLOG.sql
```

## 🔐 Segurança (RLS)

O blog usa Row Level Security do Supabase:

### Categorias
- ✅ Público: Leitura
- 🔒 Admin: Criar/Editar/Deletar

### Posts
- ✅ Público: Ler posts publicados
- 🔒 Autenticado: Criar posts
- 🔒 Autor/Admin: Editar/Deletar próprios posts

## 🎨 Categorias Padrão

O blog vem com 5 categorias pré-configuradas:

1. **Educação Inclusiva** - Práticas de educação inclusiva
2. **PEI Colaborativo** - Sobre o sistema
3. **Tutoriais** - Guias práticos
4. **Novidades** - Atualizações do sistema
5. **Dicas** - Boas práticas

## 📝 Como Criar um Post

1. Acesse `/login` e faça login como administrador
2. Vá para `/admin/post/new`
3. Preencha:
   - **Título:** Título do post
   - **Slug:** URL amigável (auto-gerado)
   - **Resumo:** Breve descrição
   - **Conteúdo:** Use o editor rich text
   - **Imagem de Capa:** URL da imagem (opcional)
   - **Categoria:** Selecione uma categoria
4. Marque "Publicar imediatamente" se quiser publicar
5. Clique em "Salvar Post"

## 🎯 Rotas

### Públicas
- `/` - Página inicial (lista de posts)
- `/post/:slug` - Visualizar post individual

### Admin
- `/login` - Login de administrador
- `/admin` - Dashboard (lista de posts)
- `/admin/post/new` - Criar novo post
- `/admin/post/edit/:id` - Editar post

## 🌐 Integração com Monorepo

O blog faz parte do ecossistema PEI Colaborativo:

- **Porta:** 5178
- **Landing Page:** http://localhost:3000
- **PEI Collab:** http://localhost:8080
- **Gestão Escolar:** http://localhost:5174
- **Plano AEE:** http://localhost:5175
- **Planejamento:** http://localhost:5176
- **Atividades:** http://localhost:5177

## 📊 Dashboard

O dashboard admin mostra:

- Total de posts
- Posts publicados
- Posts em rascunho
- Lista completa de posts com ações

## 🎨 Customização

### Cores
Edite `tailwind.config.ts` para mudar o tema de cores.

### Editor
Configure o React Quill em `CreatePost.tsx` e `EditPost.tsx` para adicionar/remover ferramentas.

### Categorias
Adicione novas categorias direto no banco de dados ou crie uma interface admin.

## 📸 Screenshots

### Página Inicial
- Hero section com título e descrição
- Busca de posts
- Grid de posts com preview

### Visualização de Post
- Imagem de capa em destaque
- Categoria e metadados
- Conteúdo formatado
- Informações do autor

### Dashboard Admin
- Estatísticas gerais
- Tabela de posts
- Ações rápidas (publicar, editar, deletar)

## 🔄 Próximas Melhorias

- [ ] Upload de imagens para Supabase Storage
- [ ] Sistema de comentários
- [ ] Tags além de categorias
- [ ] Newsletter
- [ ] Compartilhamento em redes sociais
- [ ] SEO otimizado
- [ ] PWA com cache offline
- [ ] Analytics de posts

## 🤝 Contribuindo

Este blog faz parte do sistema PEI Colaborativo. Para contribuir, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

Parte do sistema PEI Colaborativo - Todos os direitos reservados.

---

**Desenvolvido com ❤️ para educação inclusiva**

