# 📦 Guia: Geração de PEIs em Lote (PDF)

**Script:** `scripts/gerar-peis-em-lote.js`  
**Rede:** São Gonçalo dos Campos  
**Data:** 06/11/2024

---

## 🎯 O Que o Script Faz

Este script automatiza a geração de PDFs de PEIs para todos os alunos de uma rede de ensino, incluindo:

✅ **Busca automática** de todos os alunos com PEIs ativos  
✅ **Geração de planejamento com IA** (se necessário)  
✅ **Cabeçalho institucional** profissional com logo  
✅ **Salvamento organizado** em pasta local  
✅ **Processamento em lote** com controle de taxa  

---

## 🚀 Passo a Passo

### **1️⃣ Pré-requisitos**

Certifique-se de que tem instalado:
- Node.js 18+ (`node --version`)
- npm (`npm --version`)

### **2️⃣ Instalar Dependências**

```bash
npm install
```

Isso instalará:
- `@supabase/supabase-js` - Cliente Supabase
- `jspdf` - Geração de PDFs

### **3️⃣ Configurar Variáveis de Ambiente**

O script usa as variáveis do `.env`:

```env
VITE_SUPABASE_URL=https://fximylewmvsllkdczovj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Ou você pode editar diretamente no script (linhas 13-14).

### **4️⃣ Executar o Script**

```bash
node scripts/gerar-peis-em-lote.js
```

---

## 📊 O Que Acontece

### **Fase 1: Busca de Dados**
```
🔍 Buscando informações da rede...
✅ Rede encontrada: Rede Municipal de São Gonçalo dos Campos

🏫 Buscando escolas da rede...
✅ 3 escola(s) encontrada(s)

📚 Buscando PEIs ativos...
✅ 15 PEI(s) ativo(s) encontrado(s)
```

### **Fase 2: Processamento Individual**
```
🔄 Processando PEIs...

[1/15] Processando PEI abc123...
  👤 Aluno: João Silva
  🏫 Escola: E.M. São João
  ✅ PEI já tem planejamento, pulando IA
  ✅ PDF gerado: PEI_joao_silva_abc123.pdf
  ✅ Sucesso!

[2/15] Processando PEI def456...
  👤 Aluno: Maria Santos
  🏫 Escola: E.M. São João
  🤖 Gerando planejamento com IA...
  ✅ Planejamento gerado e salvo com sucesso!
  ✅ PDF gerado: PEI_maria_santos_def456.pdf
  ✅ Sucesso!

[...]
```

### **Fase 3: Relatório Final**
```
═══════════════════════════════════════════════════
📊 RELATÓRIO FINAL
═══════════════════════════════════════════════════
✅ PEIs processados com sucesso: 15
❌ PEIs com erro: 0
📁 PDFs salvos em: C:\workspace\Inclusao\pei-collab\peis-gerados-sao-goncalo
═══════════════════════════════════════════════════

🎉 Geração em lote concluída!
✅ Script finalizado com sucesso!
```

---

## 📁 Estrutura de Saída

### **Pasta Criada:**
```
pei-collab/
  └── peis-gerados-sao-goncalo/
       ├── PEI_joao_silva_abc12345.pdf
       ├── PEI_maria_santos_def45678.pdf
       ├── PEI_pedro_oliveira_ghi91011.pdf
       └── ...
```

### **Nome dos Arquivos:**
```
PEI_{nome_do_aluno}_{primeiros_8_digitos_do_id}.pdf
```

**Exemplo:**
- Aluno: "João Pedro da Silva"
- ID: `abc12345-6789-...`
- Arquivo: `PEI_joao_pedro_da_silva_abc12345.pdf`

---

## 📄 Estrutura do PDF Gerado

### **1. Cabeçalho Institucional** 🆕

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  [LOGO]    REDE MUNICIPAL DE SÃO GONÇALO DOS      │
│            CAMPOS                                  │
│            Secretaria de Educação - Setor         │
│            Educação Inclusiva                     │
│            Escola Municipal São João Batista      │
│                                                    │
│            Gerado em: 06/11/2024 15:30            │
└────────────────────────────────────────────────────┘
═══════════════════════════════════════════════════════

      PLANO EDUCACIONAL INDIVIDUALIZADO
```

### **2. Identificação do Aluno**
- Nome completo
- Data de nascimento
- Data de criação do PEI
- Status atual

### **3. Diagnóstico**
- Necessidades educacionais especiais
- Interesses e potencialidades
- Histórico escolar

### **4. Planejamento (Metas)**

Para cada meta:
```
Meta 1:
  [Título/Descrição SMART]
  Tipo: Acadêmica | BNCC: EF15LP03
  
  Estratégias:
  • Estratégia detalhada 1
  • Estratégia detalhada 2
  • Estratégia detalhada 3
  
  Avaliação:
  [Critérios mensuráveis com níveis]
  
  Recursos:
  [Lista de recursos e tecnologias]
```

### **5. Rodapé**
- Número de páginas
- Nome da rede
- Sistema (PEI Collab)

---

## ⚙️ Configurações do Script

### **Variáveis Editáveis** (linha 13-18)

```javascript
const OUTPUT_DIR = './peis-gerados-sao-goncalo';  // Pasta de saída
const NETWORK_NAME = 'São Gonçalo dos Campos';     // Nome da rede
const GENERATE_AI_PLANNING = true;                 // Gerar IA?
const BATCH_SIZE = 5;                              // Processar N por vez
```

### **Mudar Rede:**
```javascript
const NETWORK_NAME = 'Rede Municipal de Outra Cidade';
```

### **Desabilitar IA:**
```javascript
const GENERATE_AI_PLANNING = false; // Só gera PDF dos PEIs que já existem
```

### **Mudar Pasta de Saída:**
```javascript
const OUTPUT_DIR = './meus-peis-2024';
```

---

## 🤖 Geração com IA

### **Quando a IA é Usada:**

O script gera planejamento com IA **apenas se**:
1. `GENERATE_AI_PLANNING = true`
2. PEI não tem metas (`planning_data.goals` vazio)

### **Processo:**
1. Chama Edge Function `generate-pei-planning`
2. Envia diagnóstico do aluno
3. IA gera 4-6 metas (2-3 acadêmicas + 2-3 funcionais)
4. Salva no banco de dados
5. Inclui no PDF gerado

### **Tempo Estimado:**
- Sem IA: ~1 segundo por PEI
- Com IA: ~10-15 segundos por PEI (depende da API)

**Exemplo com 20 PEIs:**
- Sem IA: ~20 segundos
- Com IA: ~3-5 minutos

---

## 🔒 Segurança

### **Permissões Necessárias:**

O script usa a `ANON_KEY` que tem RLS ativado. Para funcionar:

1. **Políticas RLS devem permitir:**
   - Leitura de `tenants`
   - Leitura de `schools`
   - Leitura de `peis`
   - Leitura de `students`
   - Atualização de `peis` (para salvar IA)

2. **Edge Function:**
   - Deve estar publicada no Supabase
   - Variável `LOVABLE_API_KEY` configurada

---

## 🚨 Tratamento de Erros

### **Erros Possíveis:**

#### **1. "Rede não encontrada"**
```bash
❌ Erro fatal: Rede "São Gonçalo dos Campos" não encontrada no banco de dados
```

**Solução:**
- Verifique o nome exato da rede no banco:
```sql
SELECT id, network_name FROM tenants;
```
- Ajuste `NETWORK_NAME` no script

---

#### **2. "Nenhuma escola encontrada"**
```bash
❌ Erro fatal: Nenhuma escola encontrada para esta rede
```

**Solução:**
- Verifique se há escolas vinculadas ao tenant:
```sql
SELECT id, school_name FROM schools 
WHERE tenant_id = '<tenant_id>';
```

---

#### **3. "Erro ao gerar planejamento com IA"**
```bash
❌ Erro ao gerar planejamento com IA: 429 - Rate limit exceeded
```

**Soluções:**
- Aguarde alguns minutos e rode novamente
- Ou desabilite IA temporariamente: `GENERATE_AI_PLANNING = false`

---

#### **4. "Permission denied"**
```bash
❌ Erro ao buscar PEIs: permission denied for table peis
```

**Solução:**
- Verificar se RLS permite leitura anônima (ou usar Service Role Key)
- Ou fazer login no script antes de executar

---

## 🎛️ Opções Avançadas

### **Filtrar por Escola Específica:**

Edite o script na linha ~110:

```javascript
// Adicionar filtro por escola específica
const { data: peis } = await supabase
  .from('peis')
  .select(...)
  .eq('school_id', 'id-da-escola-especifica') // 🆕 Adicione esta linha
  .eq('is_active_version', true);
```

### **Filtrar por Status:**

```javascript
// Apenas PEIs aprovados
.eq('status', 'approved')

// Ou múltiplos status
.in('status', ['approved', 'validated'])
```

### **Incluir PEIs Arquivados:**

```javascript
// Remover filtro de versão ativa
// .eq('is_active_version', true)  // Comente esta linha
```

---

## 📊 Logs e Monitoramento

### **Logs Detalhados:**

O script exibe logs completos de cada passo:

```
🚀 Iniciando geração de PEIs em lote...
📍 Rede: São Gonçalo dos Campos
📁 Diretório de saída: ./peis-gerados-sao-goncalo
🤖 Gerar planejamento com IA: Sim
═══════════════════════════════════════════════════

🔍 Buscando informações da rede...
✅ Rede encontrada: Rede Municipal de São Gonçalo dos Campos

[1/15] Processando PEI abc123...
  👤 Aluno: João Silva
  🏫 Escola: E.M. São João
  🤖 Gerando planejamento com IA...
  ✅ Planejamento gerado e salvo!
  ✅ PDF gerado: PEI_joao_silva_abc123.pdf
  ✅ Sucesso!
```

### **Salvar Logs em Arquivo:**

```bash
node scripts/gerar-peis-em-lote.js > logs-geracao-peis.txt 2>&1
```

---

## ✅ Checklist de Uso

### **Antes de Executar:**
- [ ] Node.js instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas
- [ ] Nome da rede conferido no banco
- [ ] Espaço em disco suficiente

### **Durante Execução:**
- [ ] Acompanhar logs no terminal
- [ ] Verificar mensagens de erro
- [ ] Não interromper o processo

### **Após Execução:**
- [ ] Conferir relatório final
- [ ] Verificar PDFs gerados na pasta
- [ ] Abrir alguns PDFs para validar qualidade
- [ ] Verificar cabeçalho institucional
- [ ] Conferir se IA gerou planejamentos

---

## 🎨 Personalização do PDF

### **Editar Cores do Cabeçalho:**

```javascript
// Linha ~100
doc.setFillColor(59, 130, 246);  // RGB: azul
// Mude para:
doc.setFillColor(0, 100, 0);     // RGB: verde
```

### **Editar Fontes:**

```javascript
// Tamanho do título
doc.setFontSize(16);  // Mude para 18, 20, etc.

// Estilo
doc.setFont(undefined, 'bold');      // bold
doc.setFont(undefined, 'normal');    // normal
doc.setFont(undefined, 'italic');    // italic
```

### **Adicionar Marca D'água:**

```javascript
// Após linha ~100
doc.setTextColor(200, 200, 200);
doc.setFontSize(50);
doc.text('CONFIDENCIAL', pageWidth / 2, pageHeight / 2, {
  align: 'center',
  angle: 45,
});
doc.setTextColor(0, 0, 0);
```

---

## 📞 Suporte

### **Problemas Comuns:**

#### **"Cannot find module 'jspdf'"**
```bash
npm install jspdf --save
```

#### **"Cannot find module '@supabase/supabase-js'"**
```bash
npm install @supabase/supabase-js --save
```

#### **Script trava ou não progride**
- Verifique conexão com internet
- Verifique se Supabase está acessível
- Tente desabilitar geração de IA temporariamente

---

## 🎯 Casos de Uso

### **1. Gerar PDFs de Toda a Rede**
```bash
# Usar configuração padrão
node scripts/gerar-peis-em-lote.js
```

### **2. Gerar Apenas PEIs Sem Planejamento**
```javascript
// No script, mudar:
const GENERATE_AI_PLANNING = true;  // Gera IA para quem não tem
```

### **3. Gerar PDFs de Outra Rede**
```javascript
// No script, mudar:
const NETWORK_NAME = 'Rede Municipal de Outra Cidade';
```

### **4. Gerar em Pasta Diferente**
```javascript
// No script, mudar:
const OUTPUT_DIR = './peis-exportacao-2024';
```

---

## 📈 Performance

### **Estimativas de Tempo:**

| Cenário | 10 PEIs | 50 PEIs | 100 PEIs |
|---------|---------|---------|----------|
| Sem IA | 10 seg | 50 seg | 1m 40s |
| Com IA | 2 min | 10 min | 20 min |

**Fatores que influenciam:**
- Velocidade da conexão
- Resposta da API de IA
- Tamanho dos PEIs
- Quantidade de metas

---

## 🔍 Verificação de Qualidade

### **Após gerar, verifique:**

1. **Cabeçalho:**
   - [ ] Logo aparece (se configurada)
   - [ ] Nome da rede correto
   - [ ] Texto "Secretaria de Educação - Setor Educação Inclusiva"
   - [ ] Nome da escola correto

2. **Conteúdo:**
   - [ ] Identificação do aluno completa
   - [ ] Diagnóstico formatado
   - [ ] Metas bem estruturadas
   - [ ] Estratégias detalhadas

3. **Formatação:**
   - [ ] Texto legível
   - [ ] Sem sobreposição
   - [ ] Quebras de página adequadas
   - [ ] Rodapé com numeração

---

## 📝 Exemplo de Saída

### **Arquivo:** `PEI_joao_silva_abc12345.pdf`

**Página 1:**
```
═══════════════════════════════════════════════════
         [LOGO]  REDE MUNICIPAL DE SÃO GONÇALO
                      DOS CAMPOS
          Secretaria de Educação - Setor 
                 Educação Inclusiva
            Escola Municipal São João Batista

             Gerado em: 06/11/2024 15:30
═══════════════════════════════════════════════════

      PLANO EDUCACIONAL INDIVIDUALIZADO

1. IDENTIFICAÇÃO DO ALUNO
Nome: João Silva
Data de Nascimento: 15/03/2015
Data de Criação do PEI: 01/10/2024
Status: Aprovado

2. DIAGNÓSTICO
Necessidades Educacionais Especiais:
Transtorno do Espectro Autista (TEA) nível 1...

Interesses e Potencialidades:
Gosta muito de dinossauros e atividades com blocos...
```

**Página 2:**
```
3. PLANEJAMENTO - METAS E ESTRATÉGIAS

Meta 1: Leitura e Compreensão de Textos
Tipo: Acadêmica | BNCC: EF15LP03

Estratégias:
• Implementar rotina de leitura compartilhada...
• Utilizar organizadores gráficos visuais...
• Aplicar técnica de pré-leitura...

Avaliação:
Rubrica com 4 níveis de progresso: Nível 1...

Recursos:
Coleção de livros nivelados, aplicativo Elefante...

---

Meta 2: [...]

────────────────────────────────────────────────
Página 2 de 3 | PEI Collab - São Gonçalo dos Campos
```

---

## 🎉 Resultado Esperado

Ao final da execução, você terá:

✅ **Pasta com PDFs** organizados por nome de aluno  
✅ **Cabeçalho institucional** em todos os documentos  
✅ **Planejamentos completos** (com IA se necessário)  
✅ **Formatação profissional** pronta para impressão  
✅ **Relatório de execução** no terminal  

---

## 📞 Precisa de Ajuda?

**Me envie:**
1. Screenshot dos logs do terminal
2. Mensagem de erro completa (se houver)
3. Quantos PEIs foram processados
4. Qual rede está tentando processar

---

**🎉 Pronto para gerar PDFs em lote!**

Execute: `node scripts/gerar-peis-em-lote.js`

---

**Data:** 06/11/2024  
**Versão:** 1.0  
**Arquivo:** GUIA_GERACAO_PEIS_EM_LOTE.md

