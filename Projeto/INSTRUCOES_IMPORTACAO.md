# Instruções de Importação de Escolas via CSV

## Pré-requisitos

Antes de importar as escolas, você precisa ter as **redes de ensino (tenants)** cadastradas no sistema.

### Para São Gonçalo dos Campos
- ✅ **REDE JÁ EXISTE**: ID: `62d992ab-ef6b-4d13-b9c9-6cdfdcb59451`
- ✅ **PRONTO PARA IMPORTAR**: O arquivo `schools_sao_goncalo.csv` está 100% pronto

### Para Santanópolis
- ⚠️ **PRIMEIRO**: Criar a rede de ensino "Santanópolis" no sistema
- ⚠️ **SEGUNDO**: Copiar o `tenant_id` gerado
- ⚠️ **TERCEIRO**: Substituir `TENANT_ID_AQUI` no arquivo `schools_santanopolis.csv`

### Para Santa Bárbara
- ⚠️ **PRIMEIRO**: Criar a rede de ensino "Santa Bárbara" no sistema
- ⚠️ **SEGUNDO**: Copiar o `tenant_id` gerado
- ⚠️ **TERCEIRO**: Substituir `TENANT_ID_AQUI` no arquivo `schools_santabarbara.csv`

---

## Passo a Passo para Importar

### 1. Criar as Redes de Ensino (se ainda não existirem)

Acesse o dashboard do Superadmin e na aba **"Redes"**:
1. Clique em "Adicionar Rede"
2. Preencha os dados da rede:
   - **Nome da Rede**: "Santanópolis" ou "Santa Bárbara"
   - **Endereço**: Endereço da secretaria de educação
   - **Telefone**: Telefone de contato
   - **E-mail**: E-mail de contato
3. Clique em "Criar Rede"
4. **Copie o ID** (tenant_id) gerado

### 2. Ajustar os Arquivos CSV

Edite o arquivo CSV correspondente e substitua `TENANT_ID_AQUI` pelo ID da rede que você copiou.

**Exemplo:**
```csv
# ANTES
school_name,school_address,school_phone,school_email,tenant_id
"Escola Municipal Teste","Endereço",,"","TENANT_ID_AQUI"

# DEPOIS
school_name,school_address,school_phone,school_email,tenant_id
"Escola Municipal Teste","Endereço",,"","a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### 3. Fazer o Upload via Dashboard

1. Acesse o dashboard do Superadmin
2. Vá para a aba **"Escolas"**
3. Clique no botão **"Importar CSV"**
4. Baixe o template para ver o formato (opcional)
5. Selecione o arquivo CSV corrigido
6. Aguarde a importação
7. Verifique o resultado na mensagem de sucesso/erro

---

## Formato do CSV

O arquivo deve seguir exatamente este formato:

```csv
school_name,school_address,school_phone,school_email,tenant_id
"Nome da Escola","Endereço Completo","(00) 0000-0000","email@escola.com","uuid-da-rede"
```

### Campos Obrigatórios:
- `school_name`: Nome da escola (obrigatório)
- `tenant_id`: UUID da rede de ensino (obrigatório)

### Campos Opcionais:
- `school_address`: Endereço da escola
- `school_phone`: Telefone de contato
- `school_email`: E-mail de contato

### Importante:
- Use aspas duplas para campos que contêm vírgulas
- Deixe campos opcionais vazios (não coloque espaços)
- O `tenant_id` deve ser um UUID válido de uma rede existente no sistema

---

## Resolução de Problemas

### Erro: "tenant_id é obrigatório"
- Verifique se você substituiu todos os `TENANT_ID_AQUI` no arquivo
- Confirme que o UUID está correto (36 caracteres no formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)

### Erro: "Nome da escola é obrigatório"
- Verifique se a coluna está nomeada como `school_name` (não `name`)
- Confirme que não há escolas com nome vazio no arquivo

### Erro: "foreign key constraint"
- Confirme que a rede (tenant) já existe no sistema antes de importar
- Verifique se o `tenant_id` está correto

### Encoding com problemas
- Salve o arquivo CSV como UTF-8
- Use um editor como Notepad++ ou VS Code para garantir o encoding correto

---

## Status dos Arquivos

| Arquivo | Status | Ações Necessárias |
|---------|--------|-------------------|
| `schools_sao_goncalo.csv` | ✅ Pronto | Nenhuma - pronto para importar |
| `schools_santanopolis.csv` | ⚠️ Pendente | Substituir `TENANT_ID_AQUI` |
| `schools_santabarbara.csv` | ⚠️ Pendente | Substituir `TENANT_ID_AQUI` |

---

## Ajuda Adicional

Se precisar de ajuda, consulte:
- `ANALISE_CSV.md` - Análise detalhada dos problemas encontrados
- Dashboard do Superadmin - Tutorial interativo de importação
- Documentação Técnica Completa - Para entender a estrutura completa do banco de dados

