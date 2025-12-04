# Guia de Preenchimento de Campos INEP

Este guia explica como preencher os campos INEP necessários para exportação no formato Educacenso/Censo Escolar.

## Visão Geral

Para realizar a exportação INEP, é necessário preencher campos específicos nas tabelas do sistema. Este guia orienta o preenchimento correto de cada campo.

## Campos por Tabela

### 1. Tabela: schools (Escolas)

#### Campos Obrigatórios

**municipio_ibge**
- **Descrição**: Código IBGE do município onde a escola está localizada
- **Formato**: 7 ou 8 dígitos numéricos
- **Exemplo**: `2915000` (São Gonçalo dos Campos - BA)
- **Como obter**: Consultar tabela de municípios do IBGE ou site do IBGE
- **Onde preencher**: Formulário de edição da escola no app Gestão Escolar

**dependencia_administrativa**
- **Descrição**: Código numérico da dependência administrativa
- **Valores possíveis**:
  - `1` = Municipal
  - `2` = Estadual
  - `3` = Federal
  - `4` = Privada
- **Nota**: Este campo é preenchido automaticamente a partir de `tipo_escola`, mas pode ser ajustado manualmente
- **Onde preencher**: Formulário de edição da escola

**zona**
- **Descrição**: Zona geográfica da escola
- **Valores possíveis**: `urbana` ou `rural`
- **Onde preencher**: Formulário de edição da escola

#### Campos Recomendados

**uf**
- **Descrição**: Unidade Federativa (estado)
- **Formato**: 2 caracteres (ex: `BA`, `SP`, `RJ`)
- **Onde preencher**: Formulário de edição da escola

**codigo_inep**
- **Descrição**: Código INEP da escola (quando a escola já está cadastrada no INEP)
- **Formato**: 7 ou 8 dígitos numéricos
- **Onde preencher**: Formulário de edição da escola

**cep**
- **Descrição**: CEP da escola
- **Formato**: 8 ou 9 dígitos (com ou sem hífen)
- **Onde preencher**: Formulário de edição da escola

### 2. Tabela: students (Alunos)

#### Campos Obrigatórios (já existentes)

- `name`: Nome do aluno
- `date_of_birth`: Data de nascimento (formato DATE)
- `sexo`: Sexo (`M`, `F` ou `Outro`)

#### Campos Opcionais para INEP

**codigo_inep_aluno**
- **Descrição**: Código INEP do aluno (quando já cadastrado no INEP)
- **Formato**: 12 dígitos numéricos
- **Nota**: Se não preenchido, será gerado um ID local temporário na exportação
- **Onde preencher**: Formulário de cadastro/edição do aluno

**naturalidade**
- **Descrição**: Município de nascimento do aluno
- **Formato**: Texto livre
- **Onde preencher**: Formulário de cadastro/edição do aluno

### 3. Tabela: classes (Turmas)

#### Campos Obrigatórios (já existentes)

- `class_name`: Nome da turma
- `education_level`: Nível de ensino (enum)
- `grade`: Série/ano
- `shift`: Turno (`M`, `V`, `N` ou `I`)

#### Campos Opcionais para INEP

**codigo_inep_turma**
- **Descrição**: Código INEP da turma
- **Formato**: Até 20 caracteres alfanuméricos
- **Nota**: Se não preenchido, será gerado um ID local temporário na exportação
- **Onde preencher**: Formulário de cadastro/edição da turma

**modalidade_inep**
- **Descrição**: Modalidade de ensino conforme catálogo INEP
- **Valores possíveis**:
  - `EDUCAÇÃO_INFANTIL`
  - `ENSINO_FUNDAMENTAL`
  - `ENSINO_MÉDIO`
  - `EJA`
- **Nota**: Este campo é preenchido automaticamente a partir de `education_level`, mas pode ser ajustado manualmente
- **Onde preencher**: Formulário de cadastro/edição da turma

### 4. Tabela: student_enrollments (Matrículas)

#### Campos Obrigatórios (já existentes)

- `student_id`: ID do aluno
- `class_id`: ID da turma
- `academic_year`: Ano letivo
- `grade`: Série/ano
- `enrollment_date` ou `start_date`: Data de matrícula

#### Campos Opcionais para INEP

**codigo_inep_matricula**
- **Descrição**: Código INEP da matrícula
- **Formato**: Até 20 caracteres alfanuméricos
- **Nota**: Se não preenchido, será gerado um ID local temporário na exportação
- **Onde preencher**: Formulário de cadastro/edição da matrícula

### 5. Tabela: professionals (Profissionais)

#### Campos Obrigatórios (já existentes)

- `full_name`: Nome completo
- `date_of_birth`: Data de nascimento
- `gender`: Sexo (`M`, `F` ou outro)
- `professional_role`: Função do profissional

#### Campos Opcionais para INEP

**codigo_inep_servidor**
- **Descrição**: Código INEP do servidor/profissional
- **Formato**: 12 dígitos numéricos
- **Nota**: Se não preenchido, será gerado um ID local temporário na exportação
- **Onde preencher**: Formulário de cadastro/edição do profissional

**regime_trabalho**
- **Descrição**: Regime de trabalho
- **Valores possíveis**: `20h`, `30h`, `40h`, `Dedicação Exclusiva`
- **Onde preencher**: Formulário de cadastro/edição do profissional

**carga_horaria_semanal**
- **Descrição**: Carga horária semanal em horas
- **Formato**: Número inteiro (ex: 20, 30, 40)
- **Nota**: Este campo é preenchido automaticamente a partir de `regime_trabalho`, mas pode ser ajustado manualmente
- **Onde preencher**: Formulário de cadastro/edição do profissional

## Processo de Preenchimento

### Passo 1: Preencher Dados da Escola

1. Acesse o app **Gestão Escolar**
2. Vá para **Gerenciar Escolas**
3. Selecione a escola
4. Preencha os campos INEP obrigatórios:
   - `municipio_ibge`: Código IBGE do município
   - `zona`: `urbana` ou `rural`
   - `uf`: Sigla do estado (2 caracteres)
   - `codigo_inep`: Se a escola já tem código INEP
5. Salve as alterações

### Passo 2: Verificar Dados de Alunos

1. Acesse **Gerenciar Alunos**
2. Verifique se os alunos têm:
   - `date_of_birth` preenchido
   - `sexo` preenchido
3. Opcionalmente, preencha `codigo_inep_aluno` se disponível

### Passo 3: Verificar Dados de Turmas

1. Acesse **Gerenciar Turmas**
2. Verifique se as turmas têm:
   - `education_level` preenchido (modalidade será gerada automaticamente)
   - `shift` preenchido
   - `grade` preenchido
3. Opcionalmente, preencha `codigo_inep_turma` se disponível

### Passo 4: Verificar Dados de Profissionais

1. Acesse **Gerenciar Professores** ou **Gerenciar Profissionais**
2. Verifique se os profissionais têm:
   - `date_of_birth` preenchido
   - `gender` preenchido
   - `regime_trabalho` preenchido (carga horária será gerada automaticamente)
3. Opcionalmente, preencha `codigo_inep_servidor` se disponível

### Passo 5: Verificar Matrículas

1. As matrículas devem ter:
   - `enrollment_date` ou `start_date` preenchido
   - `academic_year` correspondente ao ano da exportação
   - `status` = `active` para matrículas ativas

## Validação Antes da Exportação

Antes de exportar, use a função de validação:

```sql
SELECT * FROM validate_inep_school_data('uuid-da-escola');
SELECT * FROM validate_inep_export_data('uuid-da-escola', 2025);
```

Ou use a interface do sistema que chama essas validações automaticamente.

## Dicas Importantes

1. **Códigos INEP**: Se a escola/aluno/profissional já tem código INEP, sempre preencha. Isso garante rastreabilidade e evita duplicações.

2. **Município IBGE**: Use sempre o código IBGE oficial. Você pode consultar em: https://www.ibge.gov.br/explica/codigos-dos-municipios.php

3. **Zona Urbana/Rural**: Defina corretamente, pois isso afeta políticas públicas e recursos.

4. **Dependência Administrativa**: Deve corresponder ao `tipo_escola`. O sistema sincroniza automaticamente, mas verifique.

5. **Modalidade de Ensino**: O sistema mapeia automaticamente de `education_level`, mas você pode ajustar se necessário.

6. **Carga Horária**: O sistema calcula automaticamente de `regime_trabalho`, mas você pode ajustar se o profissional tiver carga horária específica.

## Problemas Comuns

### Erro: "municipio_ibge inválido"
- **Causa**: Código não tem 7 ou 8 dígitos
- **Solução**: Verifique o código IBGE no site oficial do IBGE

### Erro: "dependencia_administrativa inválido"
- **Causa**: Valor não está entre 1 e 4
- **Solução**: Use apenas valores 1, 2, 3 ou 4

### Erro: "zona inválida"
- **Causa**: Valor diferente de 'urbana' ou 'rural'
- **Solução**: Use exatamente 'urbana' ou 'rural' (minúsculas)

### Aviso: "Campos INEP não preenchidos"
- **Causa**: Alguns campos obrigatórios não estão preenchidos
- **Solução**: Preencha os campos obrigatórios listados acima

## Suporte

Para dúvidas sobre códigos INEP ou formato de dados, consulte:
- Documentação oficial do INEP: https://www.gov.br/inep/pt-br
- Manual do Censo Escolar: Disponível no portal do INEP
- Documentação do sistema: `docs/educacenso/CAMPOS_INEP.md`

