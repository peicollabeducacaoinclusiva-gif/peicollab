# Guia de Teste de Exportação INEP/Educacenso

## Status Atual

### ✅ Campos INEP Preenchidos

As escolas foram atualizadas com os campos INEP obrigatórios:
- `municipio_ibge`: `2929206` (São Gonçalo dos Campos - BA)
- `uf`: `BA`
- `zona`: `urbana`
- `dependencia_administrativa`: `1` (Municipal) - preenchido automaticamente

### ⚠️ Dados Faltantes

A validação identificou que alguns dados ainda precisam ser preenchidos:
- **Alunos**: 20 alunos sem `date_of_birth` ou `sexo` preenchidos
- **Profissionais**: 13 profissionais sem `date_of_birth` ou `gender` preenchidos

**Nota**: A exportação funcionará mesmo com dados incompletos, mas os registros com dados faltantes podem gerar avisos no Educacenso.

## Como Testar a Exportação

### Passo 1: Acessar a Página de Exportação

1. Abra o app **Gestão Escolar** no navegador: `http://localhost:5177`
2. Faça login com credenciais de secretário de educação:
   - Email: `secretary@test.com`
   - Senha: `Secretary@123`
3. No menu lateral, clique em **Exportação de Dados** ou acesse: `http://localhost:5177/export`

### Passo 2: Configurar a Exportação

1. **Tipo de Dados**: Selecione "Alunos" ou "Profissionais"
2. **Formato**: Selecione **"Educacenso"** (última opção)
3. **Escola**: Selecione uma escola da lista
4. **Ano Letivo**: Digite o ano (ex: `2025`)

### Passo 3: Executar a Exportação

1. Clique no botão **"Exportar"** (ícone de download)
2. Aguarde o processamento (pode levar alguns segundos)
3. O arquivo será baixado automaticamente com o nome: `students_2025-YYYYMMDDHHMMSS.txt` ou `professionals_2025-YYYYMMDDHHMMSS.txt`

### Passo 4: Validar o Arquivo Gerado

#### Estrutura do Arquivo

O arquivo gerado deve seguir o formato Educacenso com registros delimitados por pipe (`|`):

```
00|2929206|1|Nome da Escola|29000001|2025
20|2929206|TURMA001|Nome da Turma|M|1º Ano|30|ENSINO_FUNDAMENTAL
30|ESC001_A001|Nome do Aluno|01/01/2010|M|12345678901|123456789012
40|ESC001_G001|Nome do Diretor|Diretor|01/01/2020|123456789012
50|ESC001_P001|01|20|01/01/2020|123456789012
60|ESC001_A001|TURMA001|1º Ano|01/01/2025|MATRICULADO|123456789012
99|6|hash_sha256|17/01/2025
```

#### Tipos de Registro

- **00**: Identificação da escola (1 por arquivo)
- **20**: Turmas (0..n)
- **30**: Pessoas - alunos e profissionais (0..n)
- **40**: Gestores (0..n)
- **50**: Profissionais/Staff (0..n)
- **60**: Matrículas (0..n)
- **99**: Trailer com hash SHA256 (1 por arquivo)

#### Validações Manuais

1. **Verificar Registro 00 (Escola)**:
   - Deve ter 6 campos separados por `|`
   - `municipio_ibge` deve ser `2929206`
   - `dependencia` deve ser `1` (Municipal)
   - `codigo_inep` deve estar preenchido

2. **Verificar Registros 20 (Turmas)**:
   - Deve ter 8 campos separados por `|`
   - `modalidade` deve estar no formato correto (EDUCAÇÃO_INFANTIL, ENSINO_FUNDAMENTAL, etc.)

3. **Verificar Registros 30 (Pessoas)**:
   - Deve ter 7 campos separados por `|`
   - `data_nascimento` deve estar no formato DD/MM/AAAA
   - `sexo` deve ser `M` ou `F`

4. **Verificar Registro 99 (Trailer)**:
   - Deve ter 4 campos separados por `|`
   - Deve conter o total de registros
   - Deve conter o hash SHA256 do conteúdo

### Passo 5: Testar no Ambiente Educacenso

1. Acesse o ambiente de testes do Educacenso: https://educacenso.inep.gov.br
2. Faça login com credenciais de teste
3. Vá em **Importação de Dados** ou **Envio de Arquivos**
4. Faça upload do arquivo `.txt` gerado
5. Verifique se há erros ou avisos de validação

## Problemas Comuns e Soluções

### Erro: "Escola não encontrada"
- **Causa**: ID da escola inválido ou escola inativa
- **Solução**: Verifique se a escola está ativa e o ID está correto

### Erro: "Campos INEP não preenchidos"
- **Causa**: Campos obrigatórios da escola não estão preenchidos
- **Solução**: Execute a validação e preencha os campos faltantes:
  ```sql
  SELECT * FROM validate_inep_school_data('uuid-da-escola');
  ```

### Aviso: "Registros com problemas encontrados"
- **Causa**: Alguns alunos ou profissionais não têm dados completos
- **Solução**: A exportação continuará, mas você pode preencher os dados faltantes:
  - Alunos: preencher `date_of_birth` e `sexo`
  - Profissionais: preencher `date_of_birth` e `gender`

### Arquivo vazio ou sem registros
- **Causa**: Não há dados para o ano letivo selecionado
- **Solução**: Verifique se há turmas, alunos e matrículas para o ano letivo

### Hash SHA256 inválido
- **Causa**: Problema na geração do hash (raro)
- **Solução**: Verifique se o Web Crypto API está disponível no navegador

## Validação Programática

### Validar Escola

```sql
SELECT * FROM validate_inep_school_data('uuid-da-escola');
```

### Validar Dados Completos

```sql
SELECT * FROM validate_inep_export_data('uuid-da-escola', 2025);
```

### Verificar Views de Exportação

```sql
-- Ver escolas
SELECT * FROM export_inep_escolas WHERE escola_id = 'uuid-da-escola';

-- Ver turmas
SELECT * FROM export_inep_turmas WHERE school_id = 'uuid-da-escola';

-- Ver pessoas
SELECT * FROM export_inep_pessoas WHERE school_id = 'uuid-da-escola';

-- Ver gestores
SELECT * FROM export_inep_gestores WHERE school_id = 'uuid-da-escola';

-- Ver profissionais
SELECT * FROM export_inep_profissionais WHERE school_id = 'uuid-da-escola';

-- Ver matrículas
SELECT * FROM export_inep_matriculas WHERE school_id = 'uuid-da-escola' AND academic_year = 2025;
```

## Próximos Passos

1. **Preencher dados faltantes**:
   - Atualizar alunos com `date_of_birth` e `sexo`
   - Atualizar profissionais com `date_of_birth` e `gender`

2. **Testar com dados completos**:
   - Criar uma escola de teste com todos os dados preenchidos
   - Exportar e validar o arquivo

3. **Validar no Educacenso**:
   - Fazer upload no ambiente de testes
   - Corrigir erros reportados
   - Validar formato final

4. **Documentar casos de uso**:
   - Exportação para múltiplas escolas
   - Exportação para múltiplos anos letivos
   - Tratamento de dados incompletos

## Referências

- Documentação de campos: `docs/educacenso/CAMPOS_INEP.md`
- Guia de preenchimento: `docs/educacenso/GUIA_PREENCHIMENTO_INEP.md`
- Recomendações completas: `docs/educacenso/recomendacoes_completas.md`
- Exemplo de arquivo: `docs/educacenso/exemplo_rede_ficticia_completo.txt`

