# Manual de Implantação e Manutenção - PEI Collab V3

**Versão:** 1.0  
**Data:** 30 de Novembro de 2025  
**Status:** Consolidado

---

## 1. Introdução

Este manual descreve os procedimentos necessários para a implantação (deploy), configuração e manutenção contínua do ecossistema **PEI Collab V3**. O público-alvo são administradores de sistema, DevOps e desenvolvedores responsáveis pela operação da plataforma.

---

## 2. Pré-requisitos de Infraestrutura

### 2.1. Ambiente de Desenvolvimento/Build
Para realizar o build e deploy, o ambiente deve possuir:
*   **Node.js:** Versão 18.0.0 ou superior (LTS recomendada).
*   **pnpm:** Versão 8.10.0 ou superior (Gerenciador de pacotes oficial do monorepo).
*   **Git:** Para versionamento e deploy automático.

### 2.2. Serviços Externos
*   **Supabase:** Projeto criado para Banco de Dados (PostgreSQL), Autenticação e Storage.
*   **Hospedagem Frontend:** Vercel (Recomendado) ou Netlify.

---

## 3. Configuração do Ambiente

### 3.1. Variáveis de Ambiente
Cada aplicação no monorepo requer suas próprias variáveis de ambiente, mas todas devem apontar para o mesmo projeto Supabase para garantir o funcionamento do SSO e compartilhamento de dados.

Configure as seguintes variáveis no seu serviço de hospedagem (ex: Vercel) para cada projeto:

```env
# Obrigatório para todos os apps
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica

# Opcional (dependendo de features específicas)
VITE_APP_URL=https://seu-dominio-app.com
```

### 3.2. Banco de Dados (Supabase)
Antes do primeiro deploy, é necessário preparar o banco de dados:

1.  Acesse o Dashboard do Supabase.
2.  Vá para **SQL Editor**.
3.  Execute as migrações localizadas em `supabase/migrations/` na ordem cronológica (numérica).
    *   Exemplo: `20250113000000_simple_schema_v2.sql` -> `20250113000001_support_professional.sql` -> ...
4.  Verifique se não ocorreram erros durante a execução.

---

## 4. Processo de Implantação (Deploy)

O projeto utiliza **Turborepo**, o que facilita o build de múltiplas aplicações.

### 4.1. Deploy na Vercel (Recomendado)
A Vercel possui suporte nativo a monorepos.

1.  **Importar Projeto:** Conecte seu repositório Git à Vercel.
2.  **Configurar Root Directory:** Selecione a pasta do app específico (ex: `apps/pei-collab`).
3.  **Build Command:** A Vercel detectará automaticamente, ou use:
    ```bash
    cd ../.. && pnpm build --filter @pei/pei-collab
    ```
    *Nota: O comando `cd ../..` é necessário se você definir o Root Directory como a pasta do app, para voltar à raiz do monorepo.*
4.  **Output Directory:** `dist`
5.  **Environment Variables:** Adicione as variáveis configuradas na seção 3.1.
6.  **Deploy:** Clique em Deploy.

Repita o processo para cada aplicação (`apps/gestao-escolar`, `apps/plano-aee`, etc.), criando projetos separados na Vercel.

### 4.2. Deploy Manual / Outros Servidores
Para servidores estáticos genéricos (Nginx, Apache, S3):

1.  **Build Local:**
    ```bash
    # Na raiz do projeto
    pnpm install
    pnpm build
    ```
    Isso gerará a pasta `dist/` dentro de cada aplicação em `apps/*/dist`.

2.  **Upload:**
    Copie o conteúdo da pasta `dist/` da aplicação desejada para o diretório público do seu servidor web.

3.  **Configuração de SPA:**
    Certifique-se de configurar o servidor para redirecionar todas as rotas não encontradas para `index.html` (Rewrite Rule), pois são Single Page Applications (SPA).

---

## 5. Manutenção e Operação

### 5.1. Monitoramento
*   **Logs de Erro:** Utilize o painel da Vercel (ou serviço equivalente) para monitorar erros de runtime no frontend.
*   **Banco de Dados:** Monitore o uso de CPU, RAM e Disco no Dashboard do Supabase. Verifique logs de "Slow Queries".

### 5.2. Rotinas de Backup
O Supabase realiza backups automáticos diários (dependendo do plano).
*   **Backup Manual:** Recomenda-se realizar um dump periódico do banco de dados (estrutura + dados) via CLI do Supabase ou Interface Web antes de grandes atualizações.
    ```bash
    supabase db dump -f backup_data_$(date +%Y%m%d).sql --db-url "sua-connection-string"
    ```

### 5.3. Atualização de Dependências
Para manter a segurança e performance:
1.  Rode `pnpm update -r` localmente para atualizar pacotes.
2.  Teste exaustivamente (`pnpm test`) antes de enviar para produção.
3.  Verifique breaking changes em bibliotecas críticas como `supabase-js` ou `react`.

### 5.4. Troubleshooting Comum

#### Erro: "AuthApiError: invalid claim: missing sub claim"
*   **Causa:** Token JWT inválido ou expirado.
*   **Solução:** O usuário deve fazer logout e login novamente. Verifique se as chaves do Supabase (`ANON_KEY`) estão corretas e iguais em todos os apps.

#### Erro: "PGRST116" (JSON object requested, multiple (or no) rows returned)
*   **Causa:** Uma query esperava 1 resultado mas encontrou 0 ou vários.
*   **Solução:** Verifique a integridade dos dados. Ex: Um aluno sem matrícula ativa ou com duplicidade.

#### Erro de Permissão (RLS Policy Violation)
*   **Causa:** O usuário tentou acessar dados de outra escola/rede.
*   **Solução:** Verifique a tabela `user_schools` ou `user_tenants` para garantir que o usuário tem o vínculo correto.

---

## 6. Plano de Recuperação de Desastres (DRP)

### 6.1. Perda de Dados Crítica
1.  **Parar Aplicações:** Coloque as aplicações em modo de manutenção (página estática).
2.  **Restaurar Backup:** Utilize o recurso Point-in-Time Recovery (PITR) do Supabase para restaurar o banco para o momento anterior ao incidente.
3.  **Validar:** Verifique a integridade dos dados restaurados.
4.  **Retomar:** Libere o acesso às aplicações.

### 6.2. Indisponibilidade do Provedor (Supabase/Vercel)
*   Mantenha um clone do repositório atualizado.
*   Considere ter um ambiente de "Standby" em outra região ou provedor se a criticidade do negócio exigir (Alta Disponibilidade).

---

## 7. Suporte

Para suporte técnico nível 3 (Desenvolvimento):
*   Abrir Issue no repositório do GitHub/GitLab.
*   Contatar equipe de desenvolvimento via canais oficiais.
