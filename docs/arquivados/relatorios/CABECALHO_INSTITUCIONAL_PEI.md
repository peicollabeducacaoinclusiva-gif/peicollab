# 🖨️ Cabeçalho Institucional na Impressão do PEI

**Atualização:** 06/11/2024  
**Funcionalidade:** Cabeçalho institucional completo na impressão de PEIs  
**Status:** ✅ **IMPLEMENTADO**

---

## 📋 O Que Foi Implementado

### **Novo Cabeçalho de Impressão**

Quando um PEI é impresso, ele agora exibe um cabeçalho profissional e institucional contendo:

```
┌────────────────────────────────────────────────────┐
│  [LOGO]        NOME DA REDE DE ENSINO              │
│                Secretaria de Educação              │
│           Departamento de Educação Inclusiva       │
│                Nome da Escola                      │
└────────────────────────────────────────────────────┘
═══════════════════════════════════════════════════════
         PLANO EDUCACIONAL INDIVIDUALIZADO
```

---

## 🎨 Estrutura do Cabeçalho

### **1. Logo da Rede**
- **Posição:** Esquerda do cabeçalho
- **Tamanho:** 80x80 pixels (impressão) / 100x100 pixels (máximo)
- **Origem:** Upload feito pelo Secretário de Educação
- **Storage:** Supabase Storage bucket `school-logos`
- **Formato:** PNG, JPG ou SVG

### **2. Informações Textuais (Centralizadas)**

#### **a) Nome da Rede** (Principal)
- Fonte: Bold, 14pt
- Estilo: MAIÚSCULAS
- Exemplo: `REDE MUNICIPAL DE ENSINO DE SÃO GONÇALO`

#### **b) Secretaria de Educação**
- Fonte: Semibold, 12pt
- Estilo: Normal
- Texto fixo: `Secretaria de Educação`

#### **c) Departamento de Educação Inclusiva**
- Fonte: Medium, 10pt
- Estilo: Normal
- Texto fixo: `Departamento de Educação Inclusiva`

#### **d) Nome da Escola**
- Fonte: Bold, 12pt
- Estilo: Normal
- Exemplo: `Escola Municipal São João Batista`

### **3. Separador**
- Linha dupla preta separando cabeçalho do conteúdo

---

## 🔧 Mudanças Técnicas Implementadas

### **Arquivo Modificado:** `src/components/coordinator/PrintPEIDialog.tsx`

#### **1. Atualização da Query**

```typescript
// ❌ ANTES
tenants(name),

// ✅ DEPOIS
tenants(network_name),
```

**Motivo:** O campo correto no banco é `network_name`, não `name`.

---

#### **2. Novo HTML do Cabeçalho**

```tsx
<div className="flex items-start gap-4 mb-4 pb-3 border-b-2 border-black">
  {/* Logo da Rede (se existir) */}
  {logoUrl && (
    <div className="flex-shrink-0">
      <img 
        src={logoUrl} 
        alt="Logo da Rede" 
        className="h-20 w-20 object-contain" 
      />
    </div>
  )}
  
  {/* Informações Institucionais (centralizadas) */}
  <div className="flex-1 text-center">
    <h2 className="text-lg font-bold mb-1 leading-tight uppercase">
      {pei.tenants?.network_name || "Nome da Rede"}
    </h2>
    <p className="text-sm font-semibold text-gray-800 mb-0.5 leading-tight">
      Secretaria de Educação
    </p>
    <p className="text-xs font-medium text-gray-700 mb-2 leading-tight">
      Departamento de Educação Inclusiva
    </p>
    <p className="text-sm font-bold text-gray-900 leading-tight">
      {pei.schools?.school_name || "Nome da Escola"}
    </p>
  </div>
</div>
```

---

#### **3. Estilos de Impressão Atualizados**

```css
@media print {
  .print-only-content {
    padding: 15px !important;
  }
  
  .print-only-content img {
    max-width: 100px !important;
    max-height: 100px !important;
  }
}
```

**Melhorias:**
- Padding adequado para o cabeçalho maior
- Limite de tamanho para a logo na impressão

---

## 📸 Visualização

### **Como o Cabeçalho Aparece:**

```
┌──────────────────────────────────────────────────────────┐
│                                                            │
│   [LOGO]      REDE MUNICIPAL DE ENSINO DE SÃO GONÇALO    │
│  80x80px              Secretaria de Educação              │
│             Departamento de Educação Inclusiva            │
│            Escola Municipal São João Batista              │
│                                                            │
└────────────────────────────────────────────────────────────┘
═════════════════════════════════════════════════════════════

            PLANO EDUCACIONAL INDIVIDUALIZADO

1. Identificação do Aluno
   Nome: João Silva
   ...
```

---

## 🎯 Como Usar

### **1. Upload da Logo (Secretário de Educação)**

1. Login como `education_secretary`
2. Acesse o Dashboard
3. Procure o componente de logo institucional
4. Clique em **"Personalizar Logo"**
5. Faça upload da logo da rede (PNG, JPG ou SVG)
6. A logo será salva em: `school-logos/{tenant_id}/logo.{ext}`

---

### **2. Imprimir PEI com Cabeçalho**

#### **Como Professor:**
1. Acesse **"Meus PEIs"**
2. Selecione um PEI
3. Clique no botão **"Imprimir"** ou ícone 🖨️

#### **Como Coordenador:**
1. Acesse a aba **"PEIs"**
2. Selecione um PEI da lista
3. Clique em **"Visualizar"** → Botão **"Imprimir PEI"**

#### **Como Diretor:**
1. Mesmos passos do coordenador

---

## 📊 Estrutura do Storage

### **Bucket:** `school-logos`

```
school-logos/
├── {tenant_id_1}/
│   └── logo.png
├── {tenant_id_2}/
│   └── logo.jpg
└── {tenant_id_3}/
    └── logo.svg
```

### **Permissões RLS:**

```sql
-- Secretários e Diretores podem upload/delete
CREATE POLICY "upload_logo" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'school-logos' 
  AND (is_education_secretary(auth.uid()) OR is_school_director(auth.uid()))
);

-- Todos podem visualizar (público)
CREATE POLICY "view_logo" ON storage.objects
FOR SELECT USING (bucket_id = 'school-logos');
```

---

## 🧪 Como Testar

### **Teste 1: Verificar Cabeçalho na Tela**

1. Abra um PEI para impressão
2. Visualize o preview
3. Verifique se o cabeçalho aparece corretamente

### **Teste 2: Imprimir em PDF**

1. Clique em **"Imprimir PEI"**
2. No diálogo de impressão, escolha **"Salvar como PDF"**
3. Verifique:
   - ✅ Logo aparece
   - ✅ Nome da rede está correto
   - ✅ "Secretaria de Educação" aparece
   - ✅ "Departamento de Educação Inclusiva" aparece
   - ✅ Nome da escola está correto
   - ✅ Formatação está profissional

### **Teste 3: Imprimir Fisicamente**

1. Conecte uma impressora
2. Clique em **"Imprimir PEI"**
3. Escolha a impressora física
4. Imprima uma página de teste
5. Verifique qualidade e formatação

---

## 🔍 Troubleshooting

### **Problema: Logo não aparece**

**Causa possível:** Logo não foi feita upload pelo secretário

**Solução:**
1. Verificar se há logo no storage:
```sql
SELECT * FROM storage.objects 
WHERE bucket_id = 'school-logos' 
  AND name LIKE '%/{tenant_id}/%';
```

2. Fazer upload da logo no dashboard do secretário

---

### **Problema: Nome da rede não aparece**

**Causa possível:** Campo `network_name` vazio na tabela `tenants`

**Solução:**
```sql
-- Verificar dados do tenant
SELECT id, network_name FROM tenants 
WHERE id = '<tenant_id>';

-- Atualizar se necessário
UPDATE tenants 
SET network_name = 'Nome da Rede' 
WHERE id = '<tenant_id>';
```

---

### **Problema: Nome da escola não aparece**

**Causa possível:** Campo `school_name` vazio na tabela `schools`

**Solução:**
```sql
-- Verificar dados da escola
SELECT id, school_name FROM schools 
WHERE id = '<school_id>';

-- Atualizar se necessário
UPDATE schools 
SET school_name = 'Nome da Escola' 
WHERE id = '<school_id>';
```

---

### **Problema: Formatação quebrada na impressão**

**Causa possível:** Navegador ou configurações de impressão

**Solução:**
1. Use navegadores modernos (Chrome, Edge, Firefox)
2. Configurações de impressão:
   - Tamanho do papel: A4
   - Margens: Normal ou Mínimas
   - Orientação: Retrato
   - Escala: 100%
   - Cabeçalhos e rodapés: Desativados
3. Imprimir cores de fundo: Ativado

---

## 📐 Especificações de Design

### **Tamanhos de Fonte (Impressão)**

| Elemento | Tamanho | Peso | Estilo |
|----------|---------|------|--------|
| Nome da Rede | 14pt | Bold | UPPERCASE |
| Secretaria | 12pt | Semibold | Normal |
| Departamento | 10pt | Medium | Normal |
| Nome da Escola | 12pt | Bold | Normal |
| Título PEI | 16pt | Bold | Normal |

### **Espaçamento**

| Elemento | Margem/Padding |
|----------|----------------|
| Cabeçalho | 15px padding |
| Entre logo e texto | 16px gap |
| Linha separadora | 3px abaixo do cabeçalho |
| Antes do título PEI | 16px |

### **Cores**

| Elemento | Cor |
|----------|-----|
| Nome da Rede | #000000 (preto) |
| Secretaria | #1F2937 (gray-800) |
| Departamento | #374151 (gray-700) |
| Nome da Escola | #111827 (gray-900) |
| Linha separadora | #000000 (preto) |

---

## ✅ Checklist de Validação

- [x] ✅ Logo carregada do storage
- [x] ✅ Nome da rede exibido
- [x] ✅ Texto "Secretaria de Educação" adicionado
- [x] ✅ Texto "Departamento de Educação Inclusiva" adicionado
- [x] ✅ Nome da escola exibido
- [x] ✅ Formatação profissional
- [x] ✅ Estilos de impressão atualizados
- [x] ✅ Query corrigida (network_name)
- [x] ✅ Sem erros de lint
- [x] ✅ Responsivo para impressão A4

---

## 📁 Arquivos Modificados

### ✅ `src/components/coordinator/PrintPEIDialog.tsx`

**Mudanças:**
1. Query atualizada: `tenants(network_name)`
2. Cabeçalho HTML reestruturado
3. Estilos de impressão ajustados
4. Logo redimensionada para impressão

**Linhas modificadas:** ~50-70, 190-265

---

## 📞 Próximos Passos (Opcional)

### **Melhorias Futuras:**

1. **Rodapé Institucional**
   - Adicionar endereço da escola
   - Adicionar telefone e email
   - Adicionar website

2. **Marca d'água**
   - Logo da rede como marca d'água no fundo
   - Texto "CONFIDENCIAL" se necessário

3. **QR Code**
   - Link para verificação online do PEI
   - Autenticidade via QR Code

4. **Múltiplos Templates**
   - Template formal
   - Template simplificado
   - Template colorido

---

**🎉 Cabeçalho institucional implementado com sucesso!**

Os PEIs agora têm uma apresentação profissional e institucional, com logo da rede e informações completas.

---

**Data:** 06/11/2024  
**Versão:** 2.1  
**Arquivo:** CABECALHO_INSTITUCIONAL_PEI.md  
**Autor:** AI Assistant


