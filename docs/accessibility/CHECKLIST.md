# Checklist de Acessibilidade - PEI Collab

## WCAG 2.1 Nível AA

### 1. Perceptível

#### 1.1 Alternativas de Texto
- [ ] Todas as imagens têm `alt` descritivo
- [ ] Imagens decorativas têm `alt=""`
- [ ] Gráficos e diagramas têm descrições textuais
- [ ] Vídeos têm legendas ou transcrições

#### 1.2 Mídia Baseada em Tempo
- [ ] Vídeos têm legendas
- [ ] Áudio tem transcrição
- [ ] Controles de mídia são acessíveis por teclado

#### 1.3 Adaptável
- [ ] Conteúdo pode ser apresentado sem perda de informação
- [ ] Layout responsivo funciona em diferentes tamanhos de tela
- [ ] Texto pode ser ampliado até 200% sem problemas

#### 1.4 Distinguível
- [ ] Contraste de cores mínimo 4.5:1 para texto normal
- [ ] Contraste de cores mínimo 3:1 para texto grande
- [ ] Não depende apenas de cor para transmitir informação
- [ ] Controles de áudio podem ser pausados ou ajustados

### 2. Operável

#### 2.1 Acessível por Teclado
- [ ] Toda funcionalidade é acessível por teclado
- [ ] Sem armadilhas de teclado
- [ ] Ordem de foco lógica
- [ ] Indicadores de foco visíveis

#### 2.2 Tempo Suficiente
- [ ] Usuários podem ajustar ou desativar timeouts
- [ ] Pausar, parar ou ocultar conteúdo em movimento
- [ ] Avisos de sessão expirada com tempo suficiente

#### 2.3 Convulsões
- [ ] Sem conteúdo que pisca mais de 3 vezes por segundo
- [ ] Avisos para conteúdo que pode causar convulsões

#### 2.4 Navegável
- [ ] Skip links para conteúdo principal
- [ ] Títulos de página descritivos
- [ ] Múltiplas formas de localizar conteúdo
- [ ] Foco visível e ordem lógica

### 3. Compreensível

#### 3.1 Legível
- [ ] Idioma da página identificado
- [ ] Palavras incomuns têm definições
- [ ] Abreviações têm expansões
- [ ] Texto legível (nível de leitura apropriado)

#### 3.2 Previsível
- [ ] Mudanças de foco não mudam contexto
- [ ] Mudanças de configuração não mudam contexto
- [ ] Navegação consistente
- [ ] Componentes identificados consistentemente

#### 3.3 Assistência de Entrada
- [ ] Erros identificados e descritos
- [ ] Labels ou instruções fornecidas
- [ ] Erros de entrada sugerem correção
- [ ] Confirmação para ações críticas

### 4. Robusto

#### 4.1 Compatível
- [ ] HTML válido
- [ ] Nomes, roles e valores de elementos corretos
- [ ] Status e propriedades programaticamente determináveis
- [ ] Compatível com tecnologias assistivas

## Checklist Técnico

### ARIA
- [ ] `aria-label` em botões sem texto
- [ ] `aria-describedby` para descrições adicionais
- [ ] `aria-expanded` em controles expansíveis
- [ ] `aria-live` para conteúdo dinâmico
- [ ] `aria-hidden` em conteúdo decorativo
- [ ] Roles semânticos corretos

### Formulários
- [ ] Labels associados a inputs
- [ ] Erros associados a campos
- [ ] Hints e instruções acessíveis
- [ ] Campos obrigatórios marcados
- [ ] Validação em tempo real acessível

### Navegação
- [ ] Skip links implementados
- [ ] Landmarks (main, nav, aside, etc.)
- [ ] Headings hierárquicos (h1, h2, h3)
- [ ] Breadcrumbs acessíveis

### Teclado
- [ ] Tab order lógico
- [ ] Foco visível
- [ ] Atalhos de teclado documentados
- [ ] Sem armadilhas de teclado

### Contraste
- [ ] Texto normal: mínimo 4.5:1
- [ ] Texto grande: mínimo 3:1
- [ ] Componentes UI: mínimo 3:1
- [ ] Modo de alto contraste suportado

### Responsividade
- [ ] Funciona em diferentes tamanhos de tela
- [ ] Zoom até 200% sem perda de funcionalidade
- [ ] Orientação portrait e landscape
- [ ] Touch targets mínimo 44x44px

## Ferramentas de Teste

### Automatizadas
- [ ] axe DevTools
- [ ] WAVE
- [ ] Lighthouse Accessibility Audit
- [ ] Pa11y

### Manuais
- [ ] Navegação apenas por teclado
- [ ] Teste com leitor de tela (NVDA, JAWS, VoiceOver)
- [ ] Teste de zoom 200%
- [ ] Teste de alto contraste

## Componentes Implementados

- [x] AccessibleButton - Botão com suporte ARIA completo
- [x] AccessibleInput - Input com label, erro e hint
- [x] SkipLinks - Links para pular para seções principais
- [x] VLibrasIntegration - Integração com VLibras para Libras

## Próximos Passos

1. Auditar todas as páginas com axe DevTools
2. Testar com leitores de tela
3. Corrigir problemas identificados
4. Documentar padrões de acessibilidade
5. Treinar equipe em acessibilidade

## Referências

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

