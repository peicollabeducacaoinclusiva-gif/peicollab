# 📚 GUIA DE IMPORTAÇÃO E EXPORTAÇÃO

## 🎯 Visão Geral

O app Gestão Escolar agora é o **Hub Central de Administração** do sistema PEI Colaborativo, permitindo importação e exportação de dados em lote.

---

## 📥 IMPORTAÇÃO EM LOTE

### Como Importar Dados

#### Passo 1: Preparar o Arquivo

**Formatos Aceitos:**
- CSV (`.csv`) - recomendado
- Excel (`.xlsx`, `.xls`)
- JSON (`.json`)

**Tamanho Máximo:** 10MB

**Exemplo de CSV (Alunos):**
```csv
Matrícula,Aluno(a),CPF,Data Nascimento,Responsável,Turma
00017772,AMANDA DE SOUZA,12345678909,15/03/2010,MARIA SOUZA,V1
00019262,NOAH SOUZA,98765432100,20/05/2018,DAIANE SANTOS,M01
```

**Exemplo de CSV (Profissionais):**
```csv
Código do Colaborador,Nome,Função,CPF,Data de Admissão
533,ADAILTON GERALDO,Porteiro,98551310534,13/06/2022
534,MARIA SILVA,Professor,12345678900,01/02/2023
```

#### Passo 2: Acessar Importação

1. Entre no Gestão Escolar (`http://localhost:5174`)
2. Clique em "Importação" no Dashboard
3. Ou acesse `/import` diretamente

#### Passo 3: Wizard de Importação

**Etapa 1 - Upload**
- Arraste e solte o arquivo ou clique para selecionar
- Sistema detecta formato automaticamente
- Aguarde processamento

**Etapa 2 - Mapeamento**
- Sistema tenta mapear automaticamente
- Revise e ajuste mapeamentos
- Pode salvar como template para reusar
- Pode carregar template salvo

**Etapa 3 - Validação**
- Ative validações padrão ou configure personalizadas
- Defina severidade (erro bloqueia, warning apenas avisa)
- Adicione regras customizadas se necessário

**Etapa 4 - Duplicados**
- Sistema mostra registros duplicados
- Compare lado-a-lado (existente vs novo)
- Escolha ação para cada:
  - **Pular** - mantém existente
  - **Sobrescrever** - substitui com novo
  - **Mesclar** - combina dados
  - **Criar Novo** - cria registro separado
- Pode aplicar mesma decisão para todos

**Etapa 5 - Importação**
- Progresso em tempo real
- Estatísticas (sucesso, falhas, avisos)
- Log de erros disponível para download
- Resultado final com resumo

---

## 📤 EXPORTAÇÃO DE DADOS

### Como Exportar Dados

#### Passo 1: Acessar Exportação

1. Entre no Gestão Escolar
2. Clique em "Exportação" no Dashboard
3. Ou acesse `/export`

#### Passo 2: Configurar Exportação

**1. Escolher Tipo de Dados**
- Alunos
- Profissionais

**2. Selecionar Formato**
- **CSV** - compatível com Excel, fácil de editar
- **Excel** - formatação visual, múltiplas abas
- **JSON** - estruturado, para desenvolvedores
- **Educacenso** - formato oficial INEP/MEC

**3. Aplicar Filtros**
- Escola específica ou todas
- Ano letivo
- Status (ativo/inativo)

**4. Selecionar Campos**
- Marque os campos que deseja exportar
- Botões "Selecionar Todos" / "Limpar"
- Preview opcional antes de exportar

#### Passo 3: Exportar

- Clique em "Preview" para ver dados (opcional)
- Clique em "Exportar"
- Download automático do arquivo

---

## 🔧 TEMPLATES DE IMPORTAÇÃO

### Templates Pré-configurados

#### E-grafite - Alunos (Simplificado)
Mapeia automaticamente:
- Matrícula → registration_number
- Aluno(a) → name
- CPF → cpf
- Data Nascimento → date_of_birth
- Código INEP → student_id
- Número Bolsa Família → numero_bolsa_familia
- Responsável → guardian_name
- Turma → class_name
- Série/ANO → grade
- Ano Letivo → academic_year

#### E-grafite - Colaboradores
Mapeia automaticamente:
- Código do Colaborador → registration_number
- Nome → full_name
- Função → professional_role
- CPF → cpf
- Data de Admissão → hire_date
- Data de Demissão → termination_date

### Criar Template Personalizado

1. Faça uma importação manual
2. Configure os mapeamentos desejados
3. Digite um nome para o template
4. Clique em "Salvar"
5. Na próxima importação, selecione o template salvo

---

## 📊 FORMATO EDUCACENSO

### Exportação para Censo Escolar

O sistema gera arquivo no formato oficial do INEP/MEC:

**Estrutura do Arquivo:**
```
00|CÓDIGO_INEP|ANO|NOME_ESCOLA|...
20|CÓDIGO_INEP|INEP_ALUNO|NOME|DATA_NASC|CPF|...
20|CÓDIGO_INEP|INEP_ALUNO|NOME|DATA_NASC|CPF|...
30|CÓDIGO_INEP|CPF_PROF|NOME|DATA_NASC|...
99|TOTAL_REGISTROS
```

**Tipos de Registro:**
- `00` - Dados da escola
- `20` - Dados de alunos
- `30` - Dados de profissionais
- `99` - Trailer (totalizador)

**Formato:**
- Pipe-delimited (`|`)
- Campos de largura fixa
- Encoding UTF-8
- Extensão `.txt`

### Requisitos para Educacenso

**Escola DEVE ter:**
- ✅ Código INEP cadastrado
- ✅ Nome oficial
- ✅ Endereço completo

**Alunos DEVEM ter:**
- ✅ Código INEP do aluno
- ✅ CPF
- ✅ Data de nascimento
- ✅ Matrícula ativa no ano

**Profissionais DEVEM ter:**
- ✅ CPF
- ✅ Nome completo
- ✅ Função/cargo

---

## 🔍 VALIDAÇÕES

### Validações Padrão para Alunos

| Campo | Validação | Severidade |
|-------|-----------|------------|
| nome | Obrigatório | Error |
| cpf | CPF válido | Warning |
| date_of_birth | Data válida | Warning |
| guardian_phone | Telefone válido | Warning |

### Validações Padrão para Profissionais

| Campo | Validação | Severidade |
|-------|-----------|------------|
| full_name | Obrigatório | Error |
| cpf | CPF válido | Error |
| email | Email válido | Warning |
| phone | Telefone válido | Warning |

### Adicionar Validação Customizada

1. Na etapa 3 do wizard
2. Clique em "Adicionar Regra"
3. Configure:
   - Campo
   - Tipo de validação
   - Severidade
   - Mensagem de erro
4. Salve (opcional) para reusar

---

## 🔄 RESOLUÇÃO DE DUPLICADOS

### Critérios de Duplicação

**Alunos:** Considera duplicado se houver match em:
- CPF idêntico
- OU Matrícula idêntica

**Profissionais:** Considera duplicado se houver match em:
- CPF idêntico
- OU Email idêntico

### Opções de Resolução

#### 1. Pular
- **Efeito:** Mantém registro existente, ignora novo
- **Quando usar:** Dados existentes estão corretos
- **Resultado:** 0 modificações

#### 2. Sobrescrever
- **Efeito:** Substitui todos os campos com dados novos
- **Quando usar:** Dados novos estão mais atualizados
- **Resultado:** Registro atualizado

#### 3. Mesclar
- **Efeito:** Mantém campos existentes vazios, preenche com novos
- **Quando usar:** Completar dados faltantes
- **Resultado:** Registro enriquecido

#### 4. Criar Novo
- **Efeito:** Cria registro separado (pode gerar duplicação real)
- **Quando usar:** São pessoas diferentes com dados parecidos
- **Resultado:** 2 registros no sistema

### Ação em Massa

Para aplicar a mesma decisão para todos:
1. Selecione ação no dropdown "Aplicar a todos"
2. Clique em "Aplicar"
3. Todos os duplicados terão a mesma ação

---

## 💡 DICAS E BOAS PRÁTICAS

### Importação

**✅ BOM:**
- Use templates salvos para importações recorrentes
- Faça backup antes de importação grande
- Teste com arquivo pequeno primeiro
- Revise duplicados com atenção
- Baixe log de erros para correção

**❌ EVITE:**
- Importar sem validar dados antes
- Sobrescrever sem revisar
- Ignorar warnings
- Arquivos maiores que 10MB
- Encoding diferente de UTF-8

### Exportação

**✅ BOM:**
- Use Educacenso para censo escolar oficial
- Use CSV para análise em Excel
- Use JSON para integração com sistemas
- Filtre dados antes de exportar
- Verifique preview antes do download

**❌ EVITE:**
- Exportar dados sensíveis sem necessidade
- Incluir campos desnecessários
- Exportar sem filtros (arquivos grandes)

---

## 🐛 PROBLEMAS COMUNS

### Arquivo não processa

**Problema:** Upload falha ou não é reconhecido

**Soluções:**
- Verifique formato (CSV, JSON, Excel)
- Verifique tamanho (máx 10MB)
- Verifique encoding (use UTF-8)
- Se CSV, verifique delimitador (vírgula)

### Campos não mapeiam automaticamente

**Problema:** Mapeamento automático falha

**Soluções:**
- Nomes de colunas muito diferentes
- Configure manualmente
- Salve como template para próxima vez
- Use template E-grafite se vier de lá

### Muitos duplicados encontrados

**Problema:** Sistema detecta muitos duplicados

**Soluções:**
- Normal se reimportando dados
- Use "Pular" para manter existentes
- Use "Sobrescrever" se dados novos estão corretos
- Verifique critérios de duplicação (CPF, matrícula)

### Validações bloqueando importação

**Problema:** Muitos registros com erros

**Soluções:**
- Revise dados no arquivo original
- Ajuste severidade para Warning (não bloqueia)
- Desative validações específicas
- Corrija erros e reimporte

### Exportação Educacenso vazia

**Problema:** Arquivo gerado está vazio ou incompleto

**Soluções:**
- Verifique se escola tem código INEP
- Verifique se alunos têm INEP
- Verifique ano letivo selecionado
- Verifique se matrículas estão ativas

---

## 📞 SUPORTE

Para problemas não cobertos neste guia:

1. Verifique logs no console do navegador (F12)
2. Verifique banco de dados (`import_batches`, `import_records`)
3. Consulte documentação do Supabase
4. Entre em contato com equipe de desenvolvimento

---

## 🔄 PRÓXIMAS ATUALIZAÇÕES

- [ ] Importação assíncrona (background jobs)
- [ ] Notificações por email ao concluir
- [ ] Dashboard de métricas de importação
- [ ] API REST para integração programática
- [ ] Agendamento de importações
- [ ] Sincronização bidirecional

---

**Versão**: 1.0  
**Data**: 10/11/2025  
**Status**: ✅ Produção Ready

🚀 **BOM USO DO SISTEMA DE IMPORTAÇÃO/EXPORTAÇÃO!** 🚀















