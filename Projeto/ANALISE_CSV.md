# Análise dos Arquivos CSV para Importação de Escolas

## Problemas Identificados

### 1. **schools_santabarbara.csv**
**Problemas:**
- ❌ Formato incorreto no header (aspas no lugar errado)
- ❌ Encoding UTF-8 com problemas (caracteres especiais corrompidos:)
- ❌ Colunas incorretas: usa `name` em vez de `school_name`
- ❌ Mistura dados de redes (tenants) e escolas
- ❌ Header incorreto: `name,network_name,network_email,network_phone,network_address,network_responsible`

**Formato Atual:**
```csv
"name,network_name,network_email,network_phone,network_address,network_responsible"
```

**Formato Correto Necessário:**
```csv
school_name,school_address,school_phone,school_email,tenant_id
```

---

### 2. **schools_santanopolis.csv**
**Problemas:**
- ❌ Colunas incorretas: usa `name` em vez de `school_name`
- ❌ Dados de rede misturados com dados de escola
- ❌ Falta o campo obrigatório `tenant_id`
- ⚠️ Encoding OK

**Formato Atual:**
```csv
name,network_name,network_email,network_phone,network_address,network_responsible
```

**Formato Correto Necessário:**
```csv
school_name,school_address,school_phone,school_email,tenant_id
```

---

### 3. **schools_sao_goncalo.csv**
**Status:** ✅ **QUASE PRONTO** - Melhor formato, mas precisa ajustes

**Problemas:**
- ⚠️ Coluna incorreta: usa `name` em vez de `school_name`
- ⚠️ Coluna extra: `network_id` (já tem no campo de dados, mas como string)
- ✅ Tem o `tenant_id` correto (62d992ab-ef6b-4d13-b9c9-6cdfdcb59451)
- ✅ Encoding OK

**Formato Atual:**
```csv
name,network_id,network_name,network_email,network_phone,network_address,network_responsible
```

**Formato Correto Necessário:**
```csv
school_name,school_address,school_phone,school_email,tenant_id
```

---

## Correções Necessárias

### Para Todos os Arquivos:
1. ❌ Renomear coluna `name` → `school_name`
2. ❌ Remover colunas de rede (network_name, network_email, etc)
3. ✅ Manter apenas: school_name, school_address, school_phone, school_email, tenant_id
4. ⚠️ Adicionar `tenant_id` UUID válido para cada rede

### Correções Aplicadas:

#### ✅ São Gonçalo dos Campos:
- ✅ Corrigido: Coluna renomeada para `school_name`
- ✅ Corrigido: Colunas extras removidas
- ✅ Corrigido: tenant_id mantido: 62d992ab-ef6b-4d13-b9c9-6cdfdcb59451
- ✅ **PRONTO PARA IMPORTAR**

#### ⚠️ Santanópolis:
- ✅ Corrigido: Coluna renomeada para `school_name`
- ✅ Corrigido: Colunas extras removidas
- ⚠️ **PENDENTE:** Substituir `TENANT_ID_AQUI` pelo UUID da rede de Santanópolis
- 📝 **AÇÕES NECESSÁRIAS:** 
  1. Criar rede "Santanópolis" no sistema
  2. Copiar o tenant_id gerado
  3. Substituir `TENANT_ID_AQUI` no arquivo pelo tenant_id real

#### ⚠️ Santa Bárbara:
- ✅ Corrigido: Encoding UTF-8 corrigido
- ✅ Corrigido: Coluna renomeada para `school_name`
- ✅ Corrigido: Colunas extras removidas
- ⚠️ **PENDENTE:** Substituir `TENANT_ID_AQUI` pelo UUID da rede de Santa Bárbara
- 📝 **AÇÕES NECESSÁRIAS:** 
  1. Criar rede "Santa Bárbara" no sistema
  2. Copiar o tenant_id gerado
  3. Substituir `TENANT_ID_AQUI` no arquivo pelo tenant_id real

---

## Template Correto Final

```csv
school_name,school_address,school_phone,school_email,tenant_id
"Escola Municipal João Silva","Rua das Flores, 123 - Centro","(11) 3456-7890","escola@municipio.gov.br","uuid-da-rede"
"Escola Municipal Maria Silva","Av. Principal, 456","(11) 3456-7891","escola2@municipio.gov.br","uuid-da-rede"
```

**Observações Importantes:**
- Campos obrigatórios: `school_name` e `tenant_id`
- Campos opcionais: `school_address`, `school_phone`, `school_email`
- `tenant_id` deve ser um UUID válido de uma rede existente no sistema

