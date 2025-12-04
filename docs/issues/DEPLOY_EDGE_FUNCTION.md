# Deploy da Edge Function - educacenso-export

**Data**: Janeiro 2025  
**Função**: `educacenso-export`

---

## 📋 Pré-requisitos

1. Supabase CLI instalado
2. Autenticado no Supabase
3. Projeto vinculado

---

## 🚀 Passos para Deploy

### 1. Verificar Supabase CLI

```bash
supabase --version
```

### 2. Fazer Login (se necessário)

```bash
supabase login
```

### 3. Vincular Projeto (se necessário)

```bash
supabase link --project-ref <seu-project-ref>
```

### 4. Deploy da Função

```bash
supabase functions deploy educacenso-export
```

### 5. Verificar Deploy

```bash
supabase functions list
```

---

## 🧪 Testar a Função

### Via Supabase Dashboard

1. Acessar Supabase Dashboard
2. Ir em "Edge Functions"
3. Selecionar `educacenso-export`
4. Usar o "Invoke" com payload:

```json
{
  "tenantId": "<uuid-do-tenant>",
  "schoolId": null,
  "academicYear": 2025
}
```

### Via Frontend

A função será chamada automaticamente quando o usuário clicar em "Exportar" na página `/censo`.

---

## ✅ Validação

Após o deploy, testar:

1. Acessar página `/censo`
2. Clicar em "Exportar Dados"
3. Verificar se o arquivo é baixado
4. Verificar formato do arquivo (TXT com delimitador `|`)

---

## 🔧 Troubleshooting

### Erro: "Function not found"
- Verificar se o deploy foi bem-sucedido
- Verificar nome da função (deve ser `educacenso-export`)

### Erro: "Unauthorized"
- Verificar se o token de autenticação está sendo enviado
- Verificar RLS policies

### Erro: "Validation failed"
- Verificar se os dados estão válidos
- Executar `validate_educacenso_data` primeiro

---

**Última atualização**: Janeiro 2025

