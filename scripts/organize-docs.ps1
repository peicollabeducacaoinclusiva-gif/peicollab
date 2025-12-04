# Script para organizar documentação
# Uso: .\scripts\organize-docs.ps1

Write-Host "🗂️  Organizando documentação..." -ForegroundColor Cyan

# 1. Mover documentos de testes
Write-Host "`n📋 Movendo documentos de testes..." -ForegroundColor Yellow
$testDocs = @(
    "docs/RELATORIO_TESTES_*.md",
    "docs/TESTE_*.md",
    "docs/TESTES_*.md",
    "docs/TEST_*.md",
    "docs/PLANO_TESTES_*.md",
    "docs/GUIA_TESTE_*.md",
    "docs/USUARIOS_TESTE_*.md"
)
foreach ($pattern in $testDocs) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Move-Item -Destination "docs/01-testes/" -Force -ErrorAction SilentlyContinue
}

# 2. Mover documentos de LGPD/Observabilidade
Write-Host "🔐 Movendo documentos de LGPD..." -ForegroundColor Yellow
$lgpdDocs = @(
    "docs/*LGPD*.md",
    "docs/*OBSERVABILIDADE*.md",
    "docs/*RETENCAO*.md",
    "docs/*AGENDAMENTO*.md",
    "docs/*AUDITORIA*.md",
    "docs/*INSTRUMENTACAO*.md",
    "docs/GUIA_COMPLETO_MCP_*.md",
    "docs/GUIA_*RETENCAO*.md",
    "docs/CONFIGURACAO_*RETENCAO*.md",
    "docs/CONFIGURACAO_AGENDAMENTO*.md"
)
foreach ($pattern in $lgpdDocs) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Move-Item -Destination "docs/02-lgpd-observabilidade/" -Force -ErrorAction SilentlyContinue
}

# 3. Mover documentos de correções
Write-Host "🔧 Movendo documentos de correções..." -ForegroundColor Yellow
$correcoesDocs = @(
    "docs/CORRECOES_*.md",
    "docs/CORRECAO_*.md",
    "docs/FASE*_.md",
    "docs/EVOLUCAO_*.md",
    "docs/PROGRESSO_*.md",
    "docs/CHECKPOINT_*.md",
    "docs/*TYPESCRIPT*.md",
    "docs/*PNPM*.md",
    "docs/VULNERABILIDADES*.md"
)
foreach ($pattern in $correcoesDocs) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Move-Item -Destination "docs/03-correcoes-historico/" -Force -ErrorAction SilentlyContinue
}

# 4. Mover documentos de implementações
Write-Host "⚙️  Movendo documentos de implementações..." -ForegroundColor Yellow
$implDocs = @(
    "docs/IMPLEMENTACAO_*.md",
    "docs/IMPLEMENTACOES_*.md",
    "docs/STATUS_*.md",
    "docs/SISTEMA_*.md",
    "docs/QUALIDADE_*.md"
)
foreach ($pattern in $implDocs) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Move-Item -Destination "docs/04-implementacoes/" -Force -ErrorAction SilentlyContinue
}

# 5. Mover documentos de migrações
Write-Host "🗄️  Movendo documentos de migrações..." -ForegroundColor Yellow
$migracoesDocs = @(
    "docs/MIGRACOES_*.md",
    "docs/MIGRACAO_*.md",
    "docs/APLICACAO_MIGRATIONS*.md",
    "docs/VALIDACAO_APLICACAO*.md"
)
foreach ($pattern in $migracoesDocs) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Move-Item -Destination "docs/05-migracoes/" -Force -ErrorAction SilentlyContinue
}

# 6. Mover documentos de análises e avaliações
Write-Host "📊 Movendo documentos de análises..." -ForegroundColor Yellow
$analisesDocs = @(
    "docs/ANALISE_*.md",
    "docs/MATRIZ_*.md",
    "docs/PLANO_ACOES*.md",
    "docs/PLANO_CORRECAO*.md",
    "docs/PLANO_MELHORIAS*.md"
)
foreach ($pattern in $analisesDocs) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Move-Item -Destination "docs/06-analises-avaliacoes/" -Force -ErrorAction SilentlyContinue
}

# 7. Mover documentos de padronização e qualidade
Write-Host "📐 Movendo documentos de padronização..." -ForegroundColor Yellow
$padraoDocs = @(
    "docs/*PADRONIZACAO*.md",
    "docs/*100_PORCENTO*.md",
    "docs/ESTADO_*.md",
    "docs/PLANO_QUALIDADE*.md",
    "docs/PLANO_EXECUTIVO*.md"
)
foreach ($pattern in $padraoDocs) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Move-Item -Destination "docs/04-implementacoes/" -Force -ErrorAction SilentlyContinue
}

# 8. Mover documentos de resumos e relatórios
Write-Host "📝 Movendo resumos e relatórios..." -ForegroundColor Yellow
$resumosDocs = @(
    "docs/RESUMO_*.md",
    "docs/RELATORIO_*.md",
    "docs/SUMARIO_*.md"
)
foreach ($pattern in $resumosDocs) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Move-Item -Destination "docs/06-analises-avaliacoes/" -Force -ErrorAction SilentlyContinue
}

# 9. Mover documentos de login, senhas e SSO
Write-Host "🔑 Movendo documentos de autenticação..." -ForegroundColor Yellow
$authDocs = @(
    "docs/*LOGIN*.md",
    "docs/*SENHA*.md",
    "docs/*SSO*.md",
    "docs/*RESET*.md"
)
foreach ($pattern in $authDocs) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Move-Item -Destination "docs/03-correcoes-historico/" -Force -ErrorAction SilentlyContinue
}

# 10. Mover outros documentos diversos
Write-Host "📦 Movendo documentos diversos..." -ForegroundColor Yellow
Move-Item -Path "docs/PORTS.md" -Destination "docs/desenvolvimento/" -Force -ErrorAction SilentlyContinue
Move-Item -Path "docs/ENV_*.md" -Destination "docs/desenvolvimento/" -Force -ErrorAction SilentlyContinue
Move-Item -Path "docs/DOCUMENTO_REQUISITOS*.md" -Destination "docs/06-analises-avaliacoes/" -Force -ErrorAction SilentlyContinue
Move-Item -Path "docs/CHANGELOG*.md" -Destination "docs/04-implementacoes/" -Force -ErrorAction SilentlyContinue
Move-Item -Path "docs/PROXIMOS_PASSOS*.md" -Destination "docs/04-implementacoes/" -Force -ErrorAction SilentlyContinue

# Mover documentos da raiz para docs/06-analises-avaliacoes
Move-Item -Path "RESUMO_COMMIT.md" -Destination "docs/06-analises-avaliacoes/" -Force -ErrorAction SilentlyContinue

Write-Host "`n✅ Organização concluída!" -ForegroundColor Green
Write-Host "`nPastas criadas:" -ForegroundColor Cyan
Write-Host "  📁 docs/01-testes/" -ForegroundColor White
Write-Host "  📁 docs/02-lgpd-observabilidade/" -ForegroundColor White
Write-Host "  📁 docs/03-correcoes-historico/" -ForegroundColor White
Write-Host "  📁 docs/04-implementacoes/" -ForegroundColor White
Write-Host "  📁 docs/05-migracoes/" -ForegroundColor White
Write-Host "  📁 docs/06-analises-avaliacoes/" -ForegroundColor White

