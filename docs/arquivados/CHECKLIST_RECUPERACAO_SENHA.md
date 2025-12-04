# ✅ Checklist de Configuração - Recuperação de Senha

Use este checklist para garantir que a recuperação de senha está configurada corretamente.

## 🔧 Configuração no Supabase Dashboard

- [ ] **Site URL** configurada corretamente
  - [ ] Desenvolvimento: `http://localhost:8080`
  - [ ] Produção: `https://seu-dominio.com`

- [ ] **Redirect URLs** configuradas
  - [ ] `http://localhost:8080/auth/reset-password` (desenvolvimento)
  - [ ] `http://127.0.0.1:8080/auth/reset-password` (desenvolvimento alternativo)
  - [ ] `https://seu-dominio.com/auth/reset-password` (produção)
  - [ ] URLs base também adicionadas (`/auth` e raiz)

- [ ] **Email Templates** verificados
  - [ ] Template de "Reset Password" existe
  - [ ] Template está ativo

- [ ] **SMTP** configurado (produção)
  - [ ] Provedor SMTP configurado
  - [ ] Credenciais testadas
  - [ ] Email de teste enviado com sucesso

## 💻 Configuração no Código

- [ ] **Rota** criada em `src/App.tsx`
  - [ ] `/auth/reset-password` está na lista de rotas

- [ ] **Componente** `ResetPassword.tsx` criado
  - [ ] Componente existe em `src/pages/ResetPassword.tsx`
  - [ ] Processa código automaticamente
  - [ ] Valida senha corretamente
  - [ ] Mostra erros amigáveis

- [ ] **Auth.tsx** atualizado
  - [ ] `redirectTo` aponta para `/auth/reset-password`
  - [ ] Função `resetPasswordForEmail` configurada

- [ ] **Config.toml** atualizado
  - [ ] `additional_redirect_urls` inclui `/auth/reset-password`
  - [ ] `site_url` configurada corretamente

## 🧪 Testes

- [ ] **Teste Local**
  - [ ] Solicitar recuperação de senha funciona
  - [ ] Email é recebido
  - [ ] Link redireciona para `/auth/reset-password`
  - [ ] Código é processado automaticamente
  - [ ] Formulário de nova senha aparece
  - [ ] Senha pode ser alterada com sucesso
  - [ ] Redirecionamento para dashboard após sucesso

- [ ] **Teste de Erros**
  - [ ] Link expirado mostra mensagem amigável
  - [ ] Link inválido mostra mensagem amigável
  - [ ] Senhas não coincidem mostram erro
  - [ ] Senha fraca mostra erro de validação
  - [ ] Termos não aceitos mostram erro

- [ ] **Teste em Produção**
  - [ ] URLs de produção configuradas
  - [ ] SMTP funcionando
  - [ ] Fluxo completo testado
  - [ ] Logs verificados no Supabase

## 🔒 Segurança

- [ ] Links expiram após tempo configurado
- [ ] Links só podem ser usados uma vez
- [ ] Validação de senha forte implementada
- [ ] Termos de uso aceitos antes de alterar senha
- [ ] Sessão verificada antes de permitir alteração

## 📝 Documentação

- [ ] Documentação criada (`CONFIGURACAO_RECUPERACAO_SENHA.md`)
- [ ] Checklist criado (este arquivo)
- [ ] Instruções claras para equipe

## 🚀 Deploy

- [ ] Variáveis de ambiente configuradas em produção
- [ ] URLs de produção adicionadas no Supabase
- [ ] Teste completo realizado em produção
- [ ] Monitoramento configurado (logs, erros)

---

**Última atualização:** $(date)
**Status:** ⚠️ Configure todas as opções antes de usar em produção









