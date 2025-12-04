# Comandos para Deploy da Edge Function

**Data**: Janeiro 2025  
**Função**: `educacenso-export`

---

## 📋 Pré-requisitos

1. Supabase CLI instalado
2. Autenticado no Supabase
3. Projeto vinculado

---

## 🚀 Comandos de Deploy

### 1. Verificar Supabase CLI

```bash
supabase --version
```

**Resultado esperado**: Versão do Supabase CLI (ex: `1.x.x`)

---

### 2. Fazer Login (se necessário)

```bash
supabase login
```

**Resultado esperado**: Abertura do navegador para autenticação

---

### 3. Vincular Projeto (se necessário)

```bash
supabase link --project-ref <seu-project-ref>
```

**Onde encontrar project-ref**:
- Supabase Dashboard → Settings → General → Reference ID

**Resultado esperado**: Projeto vinculado com sucesso

---

### 4. Deploy da Função

```bash
supabase functions deploy educacenso-export
```

**Resultado esperado**:
```
Deploying function educacenso-export...
Function educacenso-export deployed successfully
```

---

### 5. Verificar Deploy

```bash
supabase functions list
```

**Resultado esperado**: Lista de funções incluindo `educacenso-export`

---

## 🧪 Testar a Função

### Via Supabase Dashboard

1. Acessar: https://supabase.com/dashboard
2. Selecionar projeto
3. Ir em "Edge Functions"
4. Selecionar `educacenso-export`
5. Clicar em "Invoke"
6. Preencher payload:

```json
{
  "tenantId": "<uuid-do-tenant>",
  "schoolId": null,
  "academicYear": 2025
}
```

7. Clicar em "Invoke Function"
8. Verificar resposta (deve retornar arquivo TXT)

---

### Via Frontend

1. Acessar página `/censo`
2. Clicar em "Exportar Dados"
3. Verificar se arquivo é baixado
4. Validar formato (TXT com delimitador `|`)

---

## 🔧 Troubleshooting

### Erro: "Command not found: supabase"
**Solução**: Instalar Supabase CLI
```bash
npm install -g supabase
```

### Erro: "Not logged in"
**Solução**: Fazer login
```bash
supabase login
```

### Erro: "Project not linked"
**Solução**: Vincular projeto
```bash
supabase link --project-ref <seu-project-ref>
```

### Erro: "Function not found"
**Solução**: Verificar se o arquivo existe em `supabase/functions/educacenso-export/index.ts`

### Erro: "Unauthorized"
**Solução**: Verificar se o token de autenticação está sendo enviado corretamente

---

## ✅ Validação Pós-Deploy

- [ ] Função listada em `supabase functions list`
- [ ] Função aparece no Dashboard
- [ ] Teste via Dashboard funciona
- [ ] Teste via Frontend funciona
- [ ] Arquivo gerado está no formato correto

---

**Última atualização**: Janeiro 2025

