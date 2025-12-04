# 📱 Documentação dos Apps - PEI Collab V3

Esta pasta contém a documentação detalhada de cada aplicação do monorepo.

---

## 📚 Apps Documentados

### **1. App de Plano de AEE**

#### **📚 Versão 1.0 (Atual)**
📄 [`📚_APP_PLANO_AEE.md`](./📚_APP_PLANO_AEE.md)

**Descrição**: Sistema completo para criação e gestão de Planos de Atendimento Educacional Especializado.

**Conteúdo da Documentação**:
- ✅ Visão geral e arquitetura
- ✅ Estrutura de dados completa (tabelas e JSONB)
- ✅ Interfaces do usuário (Dashboard, Criar, Editar, Visualizar)
- ✅ Segurança e permissões (RLS)
- ✅ Integração com PEI (aparece como anexo no PDF)
- ✅ Máquina de estados e fluxo de aprovação
- ✅ Casos de uso práticos
- ✅ Como rodar e testar
- ✅ Roadmap e próximas funcionalidades

**Status**: ✅ Completo, implementado e em produção

#### **🚀 Versão 2.0 (Visão Futura)**
📄 [`🚀_APP_PLANO_AEE_V2.md`](./🚀_APP_PLANO_AEE_V2.md)

**Descrição**: Evolução completa do sistema com funcionalidades avançadas baseadas nas fichas oficiais da Bahia.

**Principais Novidades**:
- 🆕 9 novas tabelas (12 no total)
- 🆕 Avaliação diagnóstica (8 áreas)
- 🆕 Registro de atendimentos completo
- 🆕 Metas SMART gerenciadas
- 🆕 8 tipos de documentos PDF automáticos
- 🆕 Modo offline + sincronização
- 🆕 Dashboard analítico com KPIs
- 🆕 Visitas escolares + encaminhamentos
- 🆕 App mobile (React Native)

**Status**: 🔄 Em planejamento - Previsão 18 meses

#### **📋 Roadmap e Comparação**
📄 [`📋_ROADMAP_PLANO_AEE.md`](./📋_ROADMAP_PLANO_AEE.md)

**Descrição**: Comparação detalhada V1.0 vs V2.0 e plano de implementação.

**Conteúdo**:
- 📊 Tabela comparativa completa
- 🗄️ Evolução do modelo de dados
- 🎨 Evolução de funcionalidades (11 áreas)
- 🚀 Cronograma (7 fases em 18 meses)
- 💰 Estimativa de esforço
- 🎯 Critérios de sucesso
- 🔄 Estratégia de migração
- 🏆 Benefícios esperados

**Status**: 📋 Documento de planejamento aprovado

#### **🛠️ Guia de Implementação Técnica**
📄 [`🛠️_IMPLEMENTACAO_PLANO_AEE_V2.md`](./🛠️_IMPLEMENTACAO_PLANO_AEE_V2.md)

**Descrição**: Blueprint técnico detalhado para implementação da V2.0.

**Conteúdo**:
- ✅ **Fase 1 (100% detalhada)**: Scripts SQL, tipos TS, hooks, componentes React
- ✅ **Fases 2-7 (resumidas)**: Índice completo com tarefas e entregáveis
- ✅ Checklists de validação por tarefa
- ✅ Testes recomendados
- ✅ Ordem de implementação com dependências
- ✅ Código pronto para copiar e implementar

**Status**: 🛠️ Blueprint pronto para desenvolvimento (~65 páginas)

---

### **2. App PEI Collab (Principal)**
📄 _Documentação em desenvolvimento_

**Descrição**: Aplicação principal para gestão de Planos Educacionais Individualizados.

**Porta**: `http://localhost:8080`

**Funcionalidades**:
- Criação e edição de PEIs
- Sistema de comentários
- Reuniões
- Avaliações cíclicas
- Feedbacks de Profissionais de Apoio
- Geração de PDF com Plano de AEE anexado

**Status**: 🔄 Documentação em planejamento

---

### **3. App de Gestão Escolar**
📄 _Documentação em desenvolvimento_

**Descrição**: Sistema de gestão acadêmica com alunos, turmas, disciplinas e profissionais.

**Porta**: `http://localhost:5174`

**Funcionalidades**:
- Cadastro de alunos
- Gerenciamento de turmas
- Cadastro de profissionais
- Gestão de disciplinas
- Dashboard com estatísticas

**Status**: 🔄 Documentação em planejamento

---

### **4. App de Planejamento**
📄 _Documentação em desenvolvimento_

**Descrição**: Sistema para criação de planos de aula e planos de curso.

**Porta**: `http://localhost:5176` _(verificar)_

**Funcionalidades**:
- Planos de Aula
- Planos de Curso
- Biblioteca de atividades

**Status**: 🔄 Documentação em planejamento

---

### **5. App de Atividades**
📄 _Documentação em desenvolvimento_

**Descrição**: Repositório de atividades pedagógicas e banco de questões.

**Porta**: `http://localhost:5177` _(verificar)_

**Funcionalidades**:
- Criar atividades
- Explorar atividades
- Favoritar atividades
- Minhas atividades

**Status**: 🔄 Documentação em planejamento

---

## 🎯 Como Documentar um Novo App

### **Template de Documentação**

Ao criar documentação para um novo app, siga esta estrutura:

```markdown
# 📚 App de [Nome do App]

## 🎯 Visão Geral
- Descrição do app
- Objetivo principal
- Público-alvo

## 🏗️ Arquitetura
- Localização no monorepo
- Porta de desenvolvimento
- Dependências

## 🗄️ Estrutura de Dados
- Tabelas do banco
- Relacionamentos
- Políticas RLS

## 🎨 Interfaces do Usuário
- Páginas principais
- Componentes
- Fluxos de navegação

## 🔐 Segurança e Permissões
- Roles necessários
- Políticas RLS
- Validações

## 🔗 Integrações
- Com outros apps
- APIs externas
- Webhooks

## 🚀 Como Rodar
- Instalação
- Configuração
- Desenvolvimento

## 🧪 Testes
- Cenários de teste
- Como testar

## 📈 Roadmap
- Funcionalidades atuais
- Próximas features
- Melhorias planejadas

## 📝 Changelog
- Histórico de versões
```

---

## 📞 Como Contribuir

1. **Para criar documentação de um novo app**:
   - Copie o template acima
   - Crie um arquivo `📚_APP_NOME.md` nesta pasta
   - Preencha todas as seções
   - Adicione ao índice principal (`docs/resumos/📑_INDICE_DOCUMENTACAO_MONOREPO.md`)

2. **Para atualizar documentação existente**:
   - Edite o arquivo correspondente
   - Adicione data de atualização
   - Atualize o changelog

3. **Padrões**:
   - Use emoji no início do nome do arquivo
   - Mantenha linguagem clara e objetiva
   - Inclua exemplos de código quando relevante
   - Adicione diagramas se necessário

---

## 🎉 Status Geral

| App | Documentação | Status | Última Atualização |
|-----|--------------|--------|-------------------|
| **Plano de AEE V1.0** | `📚_APP_PLANO_AEE.md` | ✅ Completo e em Produção | 09/01/2025 |
| **Plano de AEE V2.0** | `🚀_APP_PLANO_AEE_V2.md` | 🔄 Visão Futura | 09/01/2025 |
| **Roadmap AEE** | `📋_ROADMAP_PLANO_AEE.md` | 📋 Planejamento | 09/01/2025 |
| **Implementação AEE V2** | `🛠️_IMPLEMENTACAO_PLANO_AEE_V2.md` | 🛠️ Blueprint Técnico | 09/01/2025 |
| **Resumo Final AEE** | `📊_RESUMO_FINAL_AEE.md` | 📊 Executivo | 09/01/2025 |
| **Estrutura AEE** | `🎯_ESTRUTURA_COMPLETA_AEE.md` | 🗺️ Mapa de Navegação | 09/01/2025 |
| PEI Collab | _Em desenvolvimento_ | 🔄 Planejado | - |
| Gestão Escolar | _Em desenvolvimento_ | 🔄 Planejado | - |
| Planejamento | _Em desenvolvimento_ | 🔄 Planejado | - |
| Atividades | _Em desenvolvimento_ | 🔄 Planejado | - |

---

## 📚 Recursos Úteis

- [Índice Completo da Documentação](../resumos/📑_INDICE_DOCUMENTACAO_MONOREPO.md)
- [Guia Completo do Monorepo](../guias/📚_GUIA_COMPLETO_MONOREPO_V3.md)
- [Instalação e Setup](../setup/📦_INSTALACAO_FINAL.md)
- [Integração PEI + Plano AEE](../integracao/🔗_INTEGRACAO_PEI_PLANO_AEE.md)

---

**Última atualização**: 09/01/2025  
**Documentos nesta pasta**: 6 documentos completos do AEE + 4 apps em planejamento

### **📊 Documentação do App de Plano de AEE**

| Doc | Linhas | Foco | Leitura |
|-----|--------|------|---------|
| V1.0 | ~620 | Sistema atual | 20 min |
| V2.0 | ~600 | Visão futura | 30 min |
| Roadmap | ~900 | Comparação | 15 min |
| Blueprint | ~2300 | Implementação | 60 min |
| Resumo Final | ~350 | Executivo | 10 min |
| Estrutura | ~350 | Navegação | 5 min |
| **Total** | **~4770** | **Completo** | **~2h20** |

