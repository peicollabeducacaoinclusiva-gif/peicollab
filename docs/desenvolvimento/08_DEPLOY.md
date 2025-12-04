# 🚀 Deploy

Guia sobre o processo de deploy do projeto.

---

## 📋 Pré-requisitos

- Conta no Supabase (produção)
- Variáveis de ambiente configuradas
- Migrações aplicadas no banco de produção

---

## 🔧 Configuração de Produção

### Variáveis de Ambiente

Configurar no ambiente de deploy (Vercel, Netlify, etc.):

```env
VITE_SUPABASE_URL=https://seu-projeto-prod.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-prod
```

### Banco de Dados

1. Aplicar migrações no Supabase de produção
2. Verificar se RLS está habilitado
3. Testar conexão

---

## 📦 Build

### Build Local

```bash
# Build de todos os apps
pnpm build

# Build de um app específico
pnpm --filter gestao-escolar build
```

### Verificar Build

```bash
# Servir build localmente
pnpm preview
```

---

## 🌐 Deploy

### Vercel (Recomendado)

1. Conectar repositório no Vercel
2. Configurar variáveis de ambiente
3. Deploy automático a cada push em `main`

### Netlify

1. Conectar repositório no Netlify
2. Configurar build command: `pnpm build`
3. Configurar publish directory: `dist`

### Manual

```bash
# Build
pnpm build

# Upload da pasta dist/ para servidor
```

---

## ✅ Checklist de Deploy

- [ ] Migrações aplicadas no banco de produção
- [ ] Variáveis de ambiente configuradas
- [ ] RLS habilitado e testado
- [ ] Build sem erros
- [ ] Testes passando
- [ ] URLs de produção funcionando
- [ ] Login funcionando
- [ ] Dados sendo carregados corretamente

---

## 🔍 Verificação Pós-Deploy

1. **Login**: Testar login com usuário real
2. **Dados**: Verificar se dados são carregados
3. **Permissões**: Testar diferentes roles
4. **Performance**: Verificar tempo de carregamento

---

## 🐛 Troubleshooting

### Erro: "Supabase connection failed"

- Verificar variáveis de ambiente
- Verificar se projeto Supabase está ativo
- Verificar CORS no Supabase

### Erro: "RLS policy violation"

- Verificar políticas RLS no Supabase
- Verificar se usuário tem permissões corretas

### Erro: "Build failed"

- Verificar logs de build
- Verificar dependências
- Verificar TypeScript errors

---

## 📚 Recursos

- **[Configuração do Ambiente](./01_CONFIGURACAO_AMBIENTE.md)**
- **[Autenticação e Segurança](./06_AUTENTICACAO_SEGURANCA.md)**
- **[Documentação do Vercel](https://vercel.com/docs)**

---

**Última atualização**: Janeiro 2025

