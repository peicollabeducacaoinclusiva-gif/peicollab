#!/usr/bin/env node

/**
 * Monitor de Performance - PEI Collab V2.1
 * Execute: node scripts/performance-monitor.js
 */

import fs from 'fs';
import path from 'path';

// Configurações
const config = {
  outputDir: 'performance-reports',
  interval: 30000, // 30 segundos
  maxReports: 10,
  thresholds: {
    loadTime: 2000, // 2 segundos
    memoryUsage: 100, // 100MB
    cacheHitRate: 80, // 80%
    bundleSize: 500000 // 500KB
  }
};

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Métricas coletadas
let metrics = {
  loadTime: 0,
  memoryUsage: 0,
  cacheHitRate: 0,
  bundleSize: 0,
  networkRequests: 0,
  offlineOperations: 0,
  errors: 0,
  warnings: 0
};

// Histórico de métricas
let history = [];

function collectMetrics() {
  const timestamp = Date.now();
  
  // Simular coleta de métricas (em produção, isso viria de APIs reais)
  const newMetrics = {
    timestamp,
    loadTime: Math.random() * 3000, // 0-3 segundos
    memoryUsage: Math.random() * 200, // 0-200MB
    cacheHitRate: Math.random() * 100, // 0-100%
    bundleSize: Math.random() * 1000000, // 0-1MB
    networkRequests: Math.floor(Math.random() * 50), // 0-50 requests
    offlineOperations: Math.floor(Math.random() * 20), // 0-20 operations
    errors: Math.floor(Math.random() * 5), // 0-5 errors
    warnings: Math.floor(Math.random() * 10) // 0-10 warnings
  };
  
  // Atualizar métricas atuais
  Object.assign(metrics, newMetrics);
  
  // Adicionar ao histórico
  history.push(newMetrics);
  
  // Manter apenas os últimos registros
  if (history.length > 100) {
    history = history.slice(-100);
  }
  
  return newMetrics;
}

function analyzeMetrics(metrics) {
  const analysis = {
    status: 'good',
    issues: [],
    recommendations: []
  };
  
  // Verificar tempo de carregamento
  if (metrics.loadTime > config.thresholds.loadTime) {
    analysis.status = 'warning';
    analysis.issues.push(`Tempo de carregamento alto: ${metrics.loadTime.toFixed(2)}ms`);
    analysis.recommendations.push('Otimizar bundle size e lazy loading');
  }
  
  // Verificar uso de memória
  if (metrics.memoryUsage > config.thresholds.memoryUsage) {
    analysis.status = 'critical';
    analysis.issues.push(`Uso de memória alto: ${metrics.memoryUsage.toFixed(2)}MB`);
    analysis.recommendations.push('Implementar garbage collection e otimizar componentes');
  }
  
  // Verificar cache hit rate
  if (metrics.cacheHitRate < config.thresholds.cacheHitRate) {
    analysis.status = 'warning';
    analysis.issues.push(`Cache hit rate baixo: ${metrics.cacheHitRate.toFixed(2)}%`);
    analysis.recommendations.push('Otimizar estratégias de cache e preload');
  }
  
  // Verificar tamanho do bundle
  if (metrics.bundleSize > config.thresholds.bundleSize) {
    analysis.status = 'warning';
    analysis.issues.push(`Bundle size grande: ${(metrics.bundleSize / 1024).toFixed(2)}KB`);
    analysis.recommendations.push('Implementar code splitting e tree shaking');
  }
  
  // Verificar erros
  if (metrics.errors > 0) {
    analysis.status = 'critical';
    analysis.issues.push(`${metrics.errors} erros detectados`);
    analysis.recommendations.push('Investigar e corrigir erros imediatamente');
  }
  
  return analysis;
}

function generateReport() {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    metrics: { ...metrics },
    analysis: analyzeMetrics(metrics),
    history: history.slice(-10), // Últimos 10 registros
    summary: {
      averageLoadTime: history.reduce((sum, h) => sum + h.loadTime, 0) / history.length,
      averageMemoryUsage: history.reduce((sum, h) => sum + h.memoryUsage, 0) / history.length,
      averageCacheHitRate: history.reduce((sum, h) => sum + h.cacheHitRate, 0) / history.length,
      totalErrors: history.reduce((sum, h) => sum + h.errors, 0),
      totalWarnings: history.reduce((sum, h) => sum + h.warnings, 0)
    }
  };
  
  return report;
}

function saveReport(report) {
  // Criar diretório se não existir
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  
  // Salvar relatório
  const filename = `performance-report-${Date.now()}.json`;
  const filepath = path.join(config.outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  
  // Manter apenas os últimos relatórios
  const files = fs.readdirSync(config.outputDir)
    .filter(f => f.startsWith('performance-report-'))
    .sort()
    .reverse();
  
  if (files.length > config.maxReports) {
    const filesToDelete = files.slice(config.maxReports);
    filesToDelete.forEach(file => {
      fs.unlinkSync(path.join(config.outputDir, file));
    });
  }
  
  return filepath;
}

function displayMetrics(metrics, analysis) {
  log('\n📊 Métricas de Performance', colors.cyan);
  log('='.repeat(50), colors.cyan);
  
  // Status geral
  const statusColor = analysis.status === 'good' ? colors.green : 
                     analysis.status === 'warning' ? colors.yellow : colors.red;
  log(`\n🎯 Status: ${analysis.status.toUpperCase()}`, statusColor);
  
  // Métricas principais
  log(`\n⏱️  Tempo de Carregamento: ${metrics.loadTime.toFixed(2)}ms`);
  log(`🧠 Uso de Memória: ${metrics.memoryUsage.toFixed(2)}MB`);
  log(`💾 Cache Hit Rate: ${metrics.cacheHitRate.toFixed(2)}%`);
  log(`📦 Bundle Size: ${(metrics.bundleSize / 1024).toFixed(2)}KB`);
  log(`🌐 Requests de Rede: ${metrics.networkRequests}`);
  log(`📱 Operações Offline: ${metrics.offlineOperations}`);
  log(`❌ Erros: ${metrics.errors}`);
  log(`⚠️  Avisos: ${metrics.warnings}`);
  
  // Issues e recomendações
  if (analysis.issues.length > 0) {
    log('\n🚨 Problemas Detectados:', colors.red);
    analysis.issues.forEach(issue => log(`• ${issue}`, colors.red));
  }
  
  if (analysis.recommendations.length > 0) {
    log('\n💡 Recomendações:', colors.yellow);
    analysis.recommendations.forEach(rec => log(`• ${rec}`, colors.yellow));
  }
}

function startMonitoring() {
  log('🚀 Iniciando Monitor de Performance', colors.cyan);
  log(`📁 Relatórios salvos em: ${config.outputDir}`, colors.blue);
  log(`⏰ Intervalo de coleta: ${config.interval / 1000}s`, colors.blue);
  
  // Coleta inicial
  const initialMetrics = collectMetrics();
  const analysis = analyzeMetrics(initialMetrics);
  displayMetrics(initialMetrics, analysis);
  
  // Configurar coleta periódica
  const interval = setInterval(() => {
    const newMetrics = collectMetrics();
    const newAnalysis = analyzeMetrics(newMetrics);
    
    // Exibir apenas se houver mudanças significativas
    if (newAnalysis.status !== 'good' || newMetrics.errors > 0) {
      displayMetrics(newMetrics, newAnalysis);
    }
    
    // Gerar e salvar relatório
    const report = generateReport();
    const filepath = saveReport(report);
    
    log(`📄 Relatório salvo: ${filepath}`, colors.green);
  }, config.interval);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    log('\n🛑 Parando monitor de performance...', colors.yellow);
    clearInterval(interval);
    
    // Gerar relatório final
    const finalReport = generateReport();
    const filepath = saveReport(finalReport);
    
    log(`📄 Relatório final salvo: ${filepath}`, colors.green);
    log('👋 Monitor de performance finalizado', colors.cyan);
    process.exit(0);
  });
}

// Executar monitor
if (import.meta.url === `file://${process.argv[1]}`) {
  startMonitoring();
}

export {
  collectMetrics,
  analyzeMetrics,
  generateReport,
  saveReport,
  startMonitoring
};
