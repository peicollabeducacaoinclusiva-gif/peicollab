# Sistema de Gestão Educacional — Recomendações técnicas e Validações (completa)

**Stack**: Vite.js (React) + Supabase (Postgres + Storage + Edge Functions)  
**Objetivo**: fornecer regras detalhadas de validação, layout de exportação `.txt` compatível com Educacenso (base 2025 — adaptar ao layout oficial do INEP quando houver variação) e artefatos úteis (exemplo de exportação, script gerador/validador e esquema SQL para Supabase).

---

## Sumário
1. Premissas gerais
2. Formato do arquivo `.txt`
3. Layouts por registro (00,10,20,30,40,50,60,99) — campos, tipo, tamanho, obrigatoriedade, validações
4. Regras de negócio e validações cross-entity
5. Validações técnicas (regex, formatos de data, codificação)
6. Procedimentos de geração/importação
7. Exemplo completo (arquivo `.txt`)
8. Scripts de geração/validação (JS)
9. Esquema SQL inicial (Supabase)
10. Checklist de implantação e testes

---

## 1. Premissas gerais
- Separador de campos: `|` (pipe).  
- Codificação: **UTF-8 sem BOM**. (Embora alguns manuais antigos indiquem ISO-8859-1, recomendamos UTF-8 e testes com o INEP).  
- Sem linhas em branco entre registros.  
- Ordem rígida de registros dentro do arquivo: 00 → 10 → 20 → 30 → 40 → 50 → 60 → 99.  
- Nome do arquivo: máximo 20 caracteres; apenas `[A-Za-z0-9_]`.  
- O layout oficial do INEP deve ser mantido por ano — versionar layouts no repositório.

---

## 2. Formato do arquivo `.txt`
- Cada linha representa um registro.  
- Cada registro começa com o código do tipo (ex.: `00`, `10`, `20`, ...).  
- Campos seguem a ordem definida no layout por tipo de registro.  
- Exemplo de linha genérica:
```
20|<municipio_code>|<turma_id>|<descricao_turma>|<turno>|<serie>|...
```

---

## 3. Layouts por registro — campos com validações

> Observação: os nomes de campo abaixo são sugestões semânticas para facilitar implementação. **Confirme** contra a planilha oficial do INEP (layout_de_importacao_e_exportacao_2025.xlsx) no momento da entrega.

### Registro 00 — Escola (obrigatório; apenas 1 por arquivo)
Campos:
1. `00` — código registro (fixo)
2. `municipio_ibge` — string numérica (7 ou 8 dígitos). Obrigatório. Regex: `^\d{7,8}$`.
3. `dependencia_adm` — código da dependência (ex: 1=Municipal, 2=Estadual, 3=Privada...). Obrigatório. Inteiro.
4. `nome_escola` — texto. Obrigatório. Máx 200 chars.
5. `inep_codigo` — código INEP da escola (quando houver). Opcional. Regex: `^\d{7,8}$` ou vazio.
6. `ano_base` — ano da base (ex: 2025). Obrigatório. Regex: `^\d{4}$`.

Validações adicionais:
- `municipio_ibge` deve existir na tabela de municípios (tabela auxiliar).
- `inep_codigo` quando presente deve existir em catálogo INEP (se disponível).

### Registro 10 — Infraestrutura (opcional; 0..1 por escola)
Campos (exemplos):
1. `10`
2. `inep_codigo` — obrigatório se informado no 00; caso contrário empty.
3. `num_salas` — inteiro >=0
4. `num_laboratorios` — inteiro >=0
5. `possui_acesso_internet` — 0/1
6. `possui_acessibilidade` — 0/1

Validações:
- Campos numéricos não negativos.
- Bounded ranges (ex.: `num_salas` <= 500).

### Registro 20 — Turma (0..n)
Campos principais:
1. `20`
2. `municipio_ibge` — obrigatório
3. `turma_id_local` — string alfanumérica (até 20)
4. `descricao` — até 100
5. `turno` — código: `M` (Matutino), `V` (Vespertino), `N` (Noturno), `I` (Integral)
6. `ano_serie` — código da série/ano (ex: 1..12 ou códigos do INEP)
7. `qtd_vagas` — inteiro >0 (opcional)
8. `codigo_modalidade` — e.g., `EDUCAÇÃO_INFANTIL`, `ENSINO_FUNDAMENTAL` (use catálogo)

Validações:
- `turma_id_local` único por escola.
- `ano_serie` coerente com modalidade (ex.: série 1..5 → ensino fundamental anos iniciais).
- `turno` restrito ao conjunto permitido.

### Registro 30 — Pessoa (base para alunos/profissionais; 0..n)
Campos:
1. `30`
2. `pessoa_id_local` — string única local (até 30)
3. `nome` — obrigatório. Máx 120
4. `data_nascimento` — `DD/MM/AAAA`. Obrigatório.
5. `sexo` — `M`/`F`/`O`
6. `cpf` — opcional; regex: `^\d{11}$` (valide dígito verificador quando informado)
7. `inep_id` — código INEP da pessoa se já identificada (opcional)

Validações:
- `data_nascimento` deve ser data válida; verificar idade compatível com série quando for aluno.
- `nome` sem caracteres especiais além dos permitidos; trim; collapse múltiplos espaços.
- Se `cpf` informado, checar unicidade e validade (algoritmo de CPF).

### Registro 40 — Gestor (0..n)
Campos:
1. `40`
2. `pessoa_id_local` — referência ao `30`.
3. `cargo_gestor` — texto (ex: Diretor(a), Vice-diretor(a))
4. `data_inicio` — `DD/MM/AAAA`
5. `inep_id` — optional

Validações:
- `pessoa_id_local` deve existir como registro `30`.
- Permitir apenas um gestor ativo por tipo (ex.: 1 diretor por escola) se regra local exigir.

### Registro 50 — Profissional (0..n)
Campos:
1. `50`
2. `pessoa_id_local`
3. `funcao` — código (ex: 01=Professor, 02=Coordenação, 03=Pedagogo)
4. `carga_horaria` — inteiro (horas semanais)
5. `data_admissao` — `DD/MM/AAAA`
6. `inep_id` — optional

Validações:
- `funcao` precisa estar em catálogo.
- `carga_horaria` dentro de intervalos permitidos.

### Registro 60 — Aluno (0..n)
Campos:
1. `60`
2. `pessoa_id_local`
3. `turma_id_local` — referência a `20`
4. `serie_ano` — ex: `6` (6º ano) ou código INEP
5. `data_matricula` — `DD/MM/AAAA`
6. `situacao` — `MATRICULADO`, `TRANSFERIDO`, `DESLIGADO`, etc.
7. `inep_id_aluno` — optional

Validações:
- `pessoa_id_local` deve existir no registro `30`.
- Um aluno não pode ter duas matrículas ativas na mesma data.
- Verificar idade-série compatibilidade (faixas etárias por série), mas permitir exceções configuráveis (EJA, multisseriada).
- Validar consistência de `situacao` com datas (ex.: `DESLIGADO` deve ter data de desligamento).

### Registro 99 — Finalizador (obrigatório; apenas 1)
Campos:
1. `99`
2. `qtd_registros` — total de registros do arquivo (opcional)
3. `hash` — hash SHA256 do conteúdo para verificação (opcional)
4. `data_geracao` — `DD/MM/AAAA`

Validações:
- Existe e único.
- Se `hash` presente, deve bater com o arquivo gerado.

---

## 4. Regras de negócio e validações cross-entity
- **Unicidade**: `pessoa_id_local` único no arquivo; `turma_id_local` único por escola.
- **Referências**: todos os pointers (`pessoa_id_local`, `turma_id_local`) devem existir previamente no arquivo. Implemente validação em duas fases: *sintática* (cada linha) e *referencial* (após leitura completa).
- **Atualização incremental**: quando gerar arquivo para importação no Educacenso, tenha opção de "modo substituição" (substitui dados existentes) ou "modo incremental" (somente diffs). Documentar riscos.
- **Regra de sobrescrita**: o INEP sobrescreve dados importados — criar confirmação / dupla validação antes do envio.

---

## 5. Validações técnicas (detalhes)
- **Datas**: formato `DD/MM/AAAA`. Valide anos entre 1900 e ano_base+1.
- **Nomes**: limite de 120 chars. Remover tabs e pipes. Normalize espaços. Evitar control chars.
- **CPF**: validar algoritmo (2 dígitos verificadores).
- **Campos numéricos**: sem separadores de milhar; usar `int` puro.
- **Tamanhos**: respeitar tamanhos máximos; truncar com aviso (não truncar automaticamente sem log).
- **Encoding**: sempre gravar em UTF-8; permitir exportação em ISO-8859-1 como opção se o INEP exigir.
- **Hash e assinatura**: calcular SHA256 do arquivo e guardar no log; opcionalmente assinar com chave privada (PKI) interna para auditoria.

---

## 6. Procedimentos de geração/importação
1. Gerar exportação de referência a partir dos dados locais.
2. Rodar validações sintáticas (regex, tipos, tamanhos).
3. Rodar validações referenciais (existência de IDs, vínculos).
4. Gerar arquivo `.txt` e hash.
5. Simular "dry-run" para detectar problemas que o INEP poderia apontar.
6. Submeter no Educacenso → importar relatórios de erro → corrigir → reenviar.
7. Fazer backup do arquivo enviado e do recibo gerado pelo INEP.

---

## 7. Exemplo completo de arquivo `.txt` (rede fictícia)
Abaixo um exemplo mais rico, com múltiplas escolas, turmas, alunos, profissionais e gestor. Use como referência para as estruturas.

```
00|2915000|1|Rede Municipal de Educação de Exemplo|1100012|2025
10|1100012|5|1|1|1
20|2915000|ESC1_T1|TURMA A - 6º ANO|M|6|25|ENSINO_FUNDAMENTAL
30|ESC1_A001|João da Silva|10/02/2013|M|12345678901|
30|ESC1_A002|Mariana Oliveira|05/08/2012|F|98765432100|
40|ESC1_G001|Carlos Pereira|Diretor|01/02/2023|
50|ESC1_P001|Ana Ribeiro|01|20|01/03/2018|
60|ESC1_A001|ESC1_T1|6|15/02/2025|MATRICULADO|
60|ESC1_A002|ESC1_T1|6|15/02/2025|MATRICULADO|
20|2915000|ESC1_T2|TURMA B - 7º ANO|V|7|22|ENSINO_FUNDAMENTAL
30|ESC1_A003|Pedro Santos|20/07/2011|M||
60|ESC1_A003|ESC1_T2|7|20/02/2025|MATRICULADO|
99|12|e3b0c44298fc1c149afbf4c8996fb92427ae41...|15/02/2025
```

---

## 8. Script de Geração & Validação (Node.js — exemplo)
O arquivo `generator_validator.js` na raiz do projeto pode:
- Ler um JSON com a rede;
- Validar campos (regex, tamanhos, referências);
- Gerar `.txt` pronto para envio;
- Gerar relatório de erros/warnings.

**Principais pontos implementados no script**:
- Validação de CPF (algoritmo).
- Check de datas, tamanhos, unicidade.
- Check referencial (pessoa referenciada existe).
- Geração do hash SHA256.
- Output: `<nome_arquivo>.txt`, `<nome_arquivo>_report.json`.

*(Arquivo JS é entregue junto a este pacote.)*

---

## 9. Esquema SQL (Supabase) — sugestão inicial
- Tabelas principais:
  - `schools` (id, inep_code, name, municipio_ibge, dependencia, created_at)
  - `people` (id, local_id, name, birthdate, cpf, sex, inep_id, created_at)
  - `staff` (id, person_id, role_code, admission_date, workload)
  - `managers` (id, person_id, school_id, start_date, role)
  - `classes` (id, school_id, local_id, description, shift, serie, capacity)
  - `enrollments` (id, person_id, class_id, enrollment_date, situation, inep_id)
  - `migration_logs` (id, filename, sha256, user_id, records_count, status, result_file_path)
- Use RLS para restringir acesso por escola.

---

## 10. Checklist de implantação e testes
- [ ] Versionar layouts INEP por ano no repo
- [ ] Implementar validações unitárias
- [ ] Testes end‑to‑end com arquivos de exemplo
- [ ] Simular reprocessamento com arquivos corrompidos
- [ ] Simular duplicidade de pessoa/CPF
- [ ] Validar performance para redes grandes (10k+ alunos)
- [ ] Treinamento para equipe da secretaria

---

## Arquivos entregues com este documento
- `recomendacoes_completas.md` (este documento)
- `exemplo_rede_ficticia_completo.txt`
- `generator_validator.js`
- `supabase_schema.sql`

Obrigado — se quiser que eu:
- adapte o layout 1:1 com a planilha XLS oficial (extrair colunas exatas),
- ou que eu gere a Edge Function em TypeScript pronta no formato Supabase — diga qual prefere que eu faça na sequência.
