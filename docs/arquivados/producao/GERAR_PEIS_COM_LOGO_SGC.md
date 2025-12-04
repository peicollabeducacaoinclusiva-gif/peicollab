# 🏛️ Gerar PEIs com Logo de São Gonçalo dos Campos

**Data:** 06/11/2024  
**Objetivo:** Gerar PDFs com o brasão oficial da cidade

---

## ⚡ PASSO A PASSO RÁPIDO

### **1️⃣ Salvar a Logo (30 segundos)**

1. **Salve a imagem do brasão** que você enviou
2. **Renomeie para:** `logo_sgc.png`
3. **Coloque na pasta:** `public/logo_sgc.png`

**Caminho completo:**
```
C:\workspace\Inclusao\pei-collab\public\logo_sgc.png
```

---

### **2️⃣ Fazer Upload da Logo no Sistema (Recomendado)**

Para que apareça automaticamente nos PDFs gerados pelo sistema:

1. **Login como Secretário de Educação** ou Superadmin
2. **Acesse o Dashboard**
3. **Procure "Personalizar Logo"** ou área de configurações
4. **Faça upload** do arquivo `logo_sgc.png`
5. **Salve**

A logo será armazenada no **Supabase Storage** e aparecerá em:
- ✅ Impressões de PEI via sistema web
- ✅ PDFs gerados em lote
- ✅ Cabeçalho do sistema

---

### **3️⃣ Gerar PDFs com Layout Correto**

#### **Opção A: Via Sistema Web (Melhor Opção) ⭐**

1. **Login como Coordenador** no sistema
2. Para cada PEI:
   - Abra o PEI
   - Clique em **"Imprimir PEI"** ou ícone 🖨️
   - No diálogo de impressão do navegador:
     - **Destino:** "Salvar como PDF"
     - **Layout:** Retrato
     - **Margems:** Padrão
     - **Cores de fundo:** Ativadas
   - Clique **"Salvar"**

**Vantagens:**
- ✅ Usa o layout HTML do sistema (PrintPEIDialog.tsx)
- ✅ Logo aparece automaticamente
- ✅ Formatação profissional
- ✅ Mesma aparência da tela

**Desvantagem:**
- ⚠️  Manual - precisa abrir cada PEI

---

#### **Opção B: Script Automatizado com HTML**

```bash
npm run generate:html-peis
```

Isso vai:
1. Gerar arquivos HTML para cada PEI
2. Incluir a logo do brasão
3. Usar layout do PrintPEIDialog
4. Salvar em `peis-sao-goncalo-html/`

Depois você pode:
- Abrir cada HTML no Chrome
- Ctrl+P → "Salvar como PDF"
- Ou usar ferramenta de conversão em lote

---

#### **Opção C: Script com Puppeteer (Automação Completa)**

Para converter HTML → PDF automaticamente, vou criar um script com Puppeteer.

**Instalar dependência:**
```bash
npm install puppeteer --save-dev
```

**Executar:**
```bash
npm run generate:peis-puppeteer
```

Vou criar este script agora...

---

## 🎨 Layout do PrintPEIDialog

O layout correto que você quer usa:

```html
<div className="print-only-content">
  <!-- Cabeçalho com Logo -->
  <div className="flex items-start gap-4 mb-4 pb-3 border-b-2 border-black">
    <img src="{logo}" className="h-20 w-20 object-contain" />
    <div className="flex-1 text-center">
      <h2>SÃO GONÇALO DOS CAMPOS</h2>
      <p>Secretaria de Educação - Setor Educação Inclusiva</p>
      <p>{Nome da Escola}</p>
    </div>
  </div>
  
  <h1>PLANO EDUCACIONAL INDIVIDUALIZADO</h1>
  
  <div>1. Identificação...</div>
  <div>2. Diagnóstico...</div>
  <div>3. Planejamento...</div>
  <div>Assinaturas...</div>
</div>
```

---

## 📋 Formato da Logo

### **Especificações:**
- **Formato:** PNG (com fundo transparente preferível)
- **Tamanho recomendado:** 512x512 pixels ou maior
- **Tamanho na impressão:** 80x80 pixels
- **Nome do arquivo:** `logo_sgc.png`
- **Localização:** `public/logo_sgc.png`

### **Características do Brasão:**
✅ Coroa mural (5 torres)  
✅ Escudo com 3 seções (azul, amarelo, verde)  
✅ Ramos floridos na seção azul  
✅ Cabeça de boi na seção verde  
✅ Faixa azul com "SÃO GONÇALO DOS CAMPOS"  

---

## 🔄 Regerar com Logo

Depois de salvar a logo em `public/logo_sgc.png`:

```bash
# Limpar pasta anterior
rm -rf peis-sao-goncalo-dos-campos

# Gerar novamente
npm run generate:sao-goncalo
```

Ou melhor, usar a opção web (imprimir um por um).

---

## 💡 Solução Ideal (Recomendação)

### **Para os 79 PEIs de São Gonçalo:**

**1. Upload da Logo no Sistema:**
- Login como education_secretary
- Dashboard → Personalizar Logo
- Upload `logo_sgc.png`

**2. Usar Funcionalidade Web:**
- Coordenadores acessam cada PEI
- Clicam "Imprimir"
- Salvam como PDF

**3. Ou Criar Script Puppeteer:**
- Automatiza navegação no sistema
- Abre cada PEI
- Clica em imprimir
- Salva PDF com layout correto

---

## 🤖 Vou Criar Script Puppeteer Agora?

Para automatizar completamente, posso criar um script que:
1. Abre o sistema no navegador headless
2. Faz login
3. Navega para cada PEI
4. Clica em "Imprimir"
5. Salva como PDF com logo e layout correto

**Quer que eu crie?** (Requer instalação do Puppeteer)

---

**Por enquanto, salve a logo em `public/logo_sgc.png` e me avise!**

Depois vou ajustar o script ou criar o automatizado com Puppeteer.

---

**Data:** 06/11/2024  
**Status:** ⏸️ Aguardando logo em public/logo_sgc.png

