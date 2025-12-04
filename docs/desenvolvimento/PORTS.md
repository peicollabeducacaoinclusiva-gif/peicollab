# Mapeamento de Portas dos Apps

Este documento lista todas as portas configuradas para cada app no monorepo.

## Apps e suas Portas

| App | Porta | Status |
|-----|-------|--------|
| **Gestão Escolar** | 5174 | ✅ Configurado |
| **Plano de AEE** | 5175 | ✅ Configurado |
| **Planejamento** | 5176 | ✅ Configurado |
| **Blog** | 5177 | ✅ Configurado |
| **Atividades** | 5178 | ✅ Configurado |
| **Portal do Responsável** | 5180 | ✅ Configurado |
| **Transporte Escolar** | 5181 | ✅ Configurado |
| **Merenda Escolar** | 5182 | ✅ Configurado |
| **PEI Collab** | 8080 | ✅ Configurado |

## URLs de Acesso

- PEI Collab: http://localhost:8080
- Gestão Escolar: http://localhost:5174
- Plano de AEE: http://localhost:5175
- Planejamento: http://localhost:5176
- Blog: http://localhost:5177
- Atividades: http://localhost:5178
- Portal do Responsável: http://localhost:5180
- Transporte Escolar: http://localhost:5181
- Merenda Escolar: http://localhost:5182

## Notas

- Todas as portas estão configuradas nos respectivos arquivos `vite.config.ts`
- Não há conflitos de portas entre os apps
- As portas seguem uma sequência lógica (5174-5182)

