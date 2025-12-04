# Campos INEP - Mapeamento Completo

Este documento descreve todos os campos necessários para exportação INEP/Censo Escolar e como eles estão mapeados no banco de dados.

## Tabela: schools

### Campos Obrigatórios para INEP

| Campo Banco | Tipo | Descrição | Validação | Mapeamento INEP |
|------------|------|-----------|-----------|-----------------|
| `municipio_ibge` | text | Código IBGE do município | 7 ou 8 dígitos numéricos | Registro 00, campo 2 |
| `dependencia_administrativa` | integer | Código de dependência | 1-4 (1=Municipal, 2=Estadual, 3=Federal, 4=Privada) | Registro 00, campo 3 |
| `zona` | text | Zona da escola | 'urbana' ou 'rural' | Registro 00 (implícito) |
| `school_name` | text | Nome da escola | Máx 200 chars | Registro 00, campo 4 |
| `codigo_inep` | text | Código INEP da escola | 7 ou 8 dígitos | Registro 00, campo 5 |

### Campos Opcionais

| Campo Banco | Tipo | Descrição | Mapeamento INEP |
|------------|------|-----------|-----------------|
| `uf` | text | Unidade Federativa | 2 caracteres (ex: BA, SP) |
| `cep` | text | CEP da escola | 8 ou 9 dígitos |
| `localizacao` | text | Localização adicional | Opcional |

### Sincronização Automática

- `dependencia_administrativa` é preenchido automaticamente a partir de `tipo_escola` via trigger

## Tabela: students

### Campos Obrigatórios para INEP

| Campo Banco | Tipo | Descrição | Validação | Mapeamento INEP |
|------------|------|-----------|-----------|-----------------|
| `name` | text | Nome do aluno | Máx 120 chars | Registro 30, campo 3 |
| `date_of_birth` | date | Data de nascimento | Formato DATE | Registro 30, campo 4 (DD/MM/AAAA) |
| `sexo` | text | Sexo | 'M', 'F' ou 'Outro' | Registro 30, campo 5 |

### Campos Opcionais

| Campo Banco | Tipo | Descrição | Mapeamento INEP |
|------------|------|-----------|-----------------|
| `codigo_inep_aluno` | text | Código INEP do aluno | 12 dígitos, único | Registro 30, campo 7 |
| `cpf` | text | CPF do aluno | 11 dígitos, validado | Registro 30, campo 6 |
| `raca_cor` | text | Raça/cor | Catálogo INEP | Registro 30 (extendido) |
| `naturalidade` | text | Naturalidade | Município de nascimento | Registro 30 (extendido) |
| `necessidades_especiais` | boolean | Possui necessidades especiais | true/false | Registro 60 (extendido) |
| `tipo_necessidade` | text[] | Tipos de necessidade | Array de tipos | Registro 60 (extendido) |

## Tabela: classes

### Campos Obrigatórios para INEP

| Campo Banco | Tipo | Descrição | Validação | Mapeamento INEP |
|------------|------|-----------|-----------|-----------------|
| `class_name` | text | Nome da turma | Máx 100 chars | Registro 20, campo 4 |
| `shift` | text | Turno | 'M', 'V', 'N' ou 'I' | Registro 20, campo 5 |
| `grade` | text | Série/ano | Texto livre | Registro 20, campo 6 |
| `education_level` | enum | Nível de ensino | Enum definido | Registro 20, campo 8 (via modalidade) |

### Campos Opcionais

| Campo Banco | Tipo | Descrição | Mapeamento INEP |
|------------|------|-----------|-----------------|
| `codigo_inep_turma` | text | Código INEP da turma | Até 20 caracteres, único por escola | Registro 20, campo 3 |
| `modalidade_inep` | text | Modalidade INEP | EDUCAÇÃO_INFANTIL, ENSINO_FUNDAMENTAL, etc. | Registro 20, campo 8 |
| `max_students` | integer | Capacidade máxima | Número de vagas | Registro 20, campo 7 |

### Sincronização Automática

- `modalidade_inep` é preenchido automaticamente a partir de `education_level` via trigger

## Tabela: student_enrollments

### Campos Obrigatórios para INEP

| Campo Banco | Tipo | Descrição | Validação | Mapeamento INEP |
|------------|------|-----------|-----------|-----------------|
| `student_id` | uuid | ID do aluno | Referência a students | Registro 60, campo 2 (via pessoa_id_local) |
| `class_id` | uuid | ID da turma | Referência a classes | Registro 60, campo 3 (via turma_id_local) |
| `academic_year` | integer | Ano letivo | Ano numérico (ex: 2025) | Registro 60 (filtro) |
| `grade` | text | Série/ano | Texto livre | Registro 60, campo 4 |
| `enrollment_date` | date | Data de matrícula | Formato DATE | Registro 60, campo 5 (DD/MM/AAAA) |
| `status` | text | Status da matrícula | 'active', 'transferred', etc. | Registro 60, campo 6 (mapeado) |

### Campos Opcionais

| Campo Banco | Tipo | Descrição | Mapeamento INEP |
|------------|------|-----------|-----------------|
| `codigo_inep_matricula` | text | Código INEP da matrícula | Até 20 caracteres | Registro 60, campo 7 |

### Mapeamento de Status

| Status Banco | Status INEP |
|--------------|-------------|
| 'active' | 'MATRICULADO' |
| 'transferred' | 'TRANSFERIDO' |
| 'completed' | 'CONCLUÍDO' |
| 'dropped' | 'DESLIGADO' |
| 'cancelled' | 'CANCELADO' |

## Tabela: professionals

### Campos Obrigatórios para INEP

| Campo Banco | Tipo | Descrição | Validação | Mapeamento INEP |
|------------|------|-----------|-----------|-----------------|
| `full_name` | text | Nome completo | Máx 120 chars | Registro 30/40/50, campo 3 |
| `date_of_birth` | date | Data de nascimento | Formato DATE | Registro 30, campo 4 (DD/MM/AAAA) |
| `gender` | text | Sexo | 'M', 'F' ou outro | Registro 30, campo 5 |
| `professional_role` | enum | Função do profissional | Enum definido | Registro 50, campo 3 (mapeado para código) |

### Campos Opcionais

| Campo Banco | Tipo | Descrição | Mapeamento INEP |
|------------|------|-----------|-----------------|
| `codigo_inep_servidor` | text | Código INEP do servidor | 12 dígitos, único | Registro 30/40/50, campo 7 |
| `cpf` | text | CPF do profissional | 11 dígitos, validado | Registro 30, campo 6 |
| `regime_trabalho` | text | Regime de trabalho | '20h', '30h', '40h', 'Dedicação Exclusiva' | Registro 50 (via carga_horaria) |
| `carga_horaria_semanal` | integer | Carga horária semanal | Horas (ex: 20, 30, 40) | Registro 50, campo 4 |
| `hire_date` | date | Data de admissão | Formato DATE | Registro 50, campo 5 (DD/MM/AAAA) |
| `formation` | text | Formação | Texto livre | Registro 50 (extendido) |

### Mapeamento de Funções (Registro 50)

| professional_role | Código INEP | Descrição |
|-------------------|-------------|-----------|
| 'professor' | '01' | Professor |
| 'professor_aee' | '02' | Professor AEE |
| 'coordenador' | '03' | Coordenador |
| 'psicologo' | '04' | Psicólogo |
| 'fonoaudiologo' | '05' | Fonoaudiólogo |
| 'terapeuta_ocupacional' | '06' | Terapeuta Ocupacional |
| 'assistente_social' | '07' | Assistente Social |
| 'profissional_apoio' | '08' | Profissional de Apoio |
| outros | '99' | Outros |

### Sincronização Automática

- `carga_horaria_semanal` é preenchido automaticamente a partir de `regime_trabalho` via trigger

## Views de Exportação

As seguintes views foram criadas para facilitar a exportação:

- `export_inep_escolas`: Dados de escolas (Registro 00)
- `export_inep_turmas`: Dados de turmas (Registro 20)
- `export_inep_pessoas`: Dados de pessoas - alunos e profissionais (Registro 30)
- `export_inep_gestores`: Dados de gestores (Registro 40)
- `export_inep_profissionais`: Dados de profissionais (Registro 50)
- `export_inep_matriculas`: Dados de matrículas (Registro 60)

## Funções de Validação

### `validate_inep_school_data(school_id uuid)`

Valida se uma escola tem todos os campos INEP preenchidos corretamente.

Retorna:
- `campo`: Nome do campo
- `valor_atual`: Valor atual do campo
- `esta_preenchido`: Se o campo está preenchido e válido
- `mensagem`: Mensagem de validação

### `validate_inep_export_data(school_id uuid, academic_year integer)`

Valida dados completos de uma escola para exportação INEP.

Retorna:
- `tipo_validacao`: Tipo de validação
- `total_registros`: Total de registros
- `registros_validos`: Registros válidos
- `registros_invalidos`: Registros inválidos
- `problemas`: Array JSON com problemas encontrados

## Como Preencher Campos INEP

1. **Escola**: Preencher `municipio_ibge`, `dependencia_administrativa`, `zona` e `uf`
2. **Alunos**: Preencher `date_of_birth`, `sexo` (obrigatórios). `codigo_inep_aluno` é opcional mas recomendado
3. **Turmas**: `modalidade_inep` é preenchido automaticamente, mas pode ser ajustado manualmente
4. **Profissionais**: Preencher `date_of_birth`, `gender` (obrigatórios). `codigo_inep_servidor` é opcional mas recomendado
5. **Matrículas**: Preencher `enrollment_date` ou `start_date` (obrigatório)

## Notas Importantes

- Todos os campos INEP são opcionais (nullable) para manter compatibilidade retroativa
- O sistema continua funcionando sem campos INEP preenchidos
- A exportação INEP só funciona corretamente quando campos obrigatórios estão preenchidos
- Use as funções de validação antes de exportar para verificar dados faltantes

