# Script PowerShell para aplicar migração RLS
# Uso: .\scripts\apply-rls-migration-simple.ps1

Write-Host "🚀 Aplicando migração RLS para Education Secretary Dashboard..." -ForegroundColor Cyan
Write-Host ""

$migrationFile = "supabase\migrations\20250221000001_fix_education_secretary_rls_dashboard.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Arquivo de migração não encontrado: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Arquivo encontrado: $migrationFile" -ForegroundColor Green
Write-Host ""

# Verificar se o Supabase CLI está instalado
try {
    $null = Get-Command supabase -ErrorAction Stop
    $supabaseInstalled = $true
} catch {
    $supabaseInstalled = $false
}

if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Para aplicar a migração manualmente:" -ForegroundColor Yellow
    Write-Host "   1. Acesse: https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "   2. Vá para SQL Editor" -ForegroundColor White
    Write-Host "   3. Cole o conteúdo do arquivo: $migrationFile" -ForegroundColor White
    Write-Host "   4. Execute a query" -ForegroundColor White
    exit 1
}

Write-Host "✅ Supabase CLI encontrado" -ForegroundColor Green
Write-Host ""

# Tentar aplicar via Supabase CLI
Write-Host "📋 Tentando aplicar migração via Supabase CLI..." -ForegroundColor Cyan
Write-Host ""

# Verificar se o projeto está linkado
$linkStatus = supabase status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Projeto não está linkado ao Supabase" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Opções para aplicar a migração:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Linkar o projeto primeiro:" -ForegroundColor White
    Write-Host "   supabase link --project-ref SEU_PROJECT_REF" -ForegroundColor Gray
    Write-Host "   supabase db push --linked" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Executar manualmente no Supabase Dashboard:" -ForegroundColor White
    Write-Host "   - Acesse: https://supabase.com/dashboard" -ForegroundColor Gray
    Write-Host "   - Vá para SQL Editor" -ForegroundColor Gray
    Write-Host "   - Cole o conteúdo de: $migrationFile" -ForegroundColor Gray
    Write-Host "   - Execute a query" -ForegroundColor Gray
    Write-Host ""
    
    # Mostrar o conteúdo do arquivo para facilitar
    Write-Host "📄 Conteúdo da migração (copie e cole no SQL Editor):" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray
    Get-Content $migrationFile | Write-Host
    Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray
    
    exit 0
}

# Se estiver linkado, tentar aplicar
Write-Host "✅ Projeto linkado, aplicando migração..." -ForegroundColor Green
supabase db push --linked --include-all

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migração aplicada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Verifique se as políticas foram criadas corretamente" -ForegroundColor White
    Write-Host "   2. Teste o dashboard do secretário de educação" -ForegroundColor White
    Write-Host "   3. Verifique se os usuários estão sendo contados corretamente" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️  Erro ao aplicar via CLI. Execute manualmente no Supabase Dashboard." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📄 Conteúdo da migração:" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray
    Get-Content $migrationFile | Write-Host
    Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray
}
