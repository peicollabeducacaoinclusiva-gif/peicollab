// k6 Load Testing Script - PEI Collab
// Testa performance e capacidade do sistema

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const dashboardDuration = new Trend('dashboard_duration');

// Configuração do teste
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Warm-up: 10 usuários
    { duration: '1m', target: 50 },    // Ramp-up: até 50 usuários
    { duration: '2m', target: 100 },   // Pico: 100 usuários concorrentes
    { duration: '1m', target: 50 },    // Ramp-down: volta para 50
    { duration: '30s', target: 0 },    // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% das requests < 2s
    http_req_failed: ['rate<0.01'],    // Taxa de erro < 1%
    errors: ['rate<0.05'],             // Taxa de erros customizados < 5%
  },
};

const BASE_URL = 'https://www.peicollab.com.br';

// Credenciais de teste
const credentials = [
  { email: 'teacher@test.com', password: 'Teacher@123', role: 'teacher' },
  { email: 'coordinator@test.com', password: 'Coord@123', role: 'coordinator' },
  { email: 'manager@test.com', password: 'Manager@123', role: 'school_manager' },
];

export default function () {
  // Selecionar credencial aleatória
  const cred = credentials[Math.floor(Math.random() * credentials.length)];

  // ========================================================================
  // Cenário 1: Landing Page
  // ========================================================================
  let res = http.get(`${BASE_URL}/`);
  check(res, {
    'landing page loaded': (r) => r.status === 200,
    'landing has title': (r) => r.body.includes('PEI Collab'),
  });
  sleep(1);

  // ========================================================================
  // Cenário 2: Página de Login
  // ========================================================================
  res = http.get(`${BASE_URL}/auth`);
  check(res, {
    'auth page loaded': (r) => r.status === 200,
    'auth has form': (r) => r.body.includes('Email'),
  });
  sleep(0.5);

  // ========================================================================
  // Cenário 3: Login (via Supabase)
  // ========================================================================
  const loginStart = Date.now();
  
  res = http.post(
    'https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password',
    JSON.stringify({
      email: cred.email,
      password: cred.password,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY0NzIsImV4cCI6MjA3NzI3MjQ3Mn0.3FqQqUfVgD3hIh1daa3R1JjouGZ4D4ONR6SmcL9Qids',
      },
    }
  );

  const loginSuccess = check(res, {
    'login successful': (r) => r.status === 200,
    'received access token': (r) => r.json('access_token') !== undefined,
  });

  errorRate.add(!loginSuccess);
  loginDuration.add(Date.now() - loginStart);

  if (!loginSuccess) {
    console.error(`Login failed for ${cred.email}`);
    return;
  }

  const accessToken = res.json('access_token');
  sleep(0.5);

  // ========================================================================
  // Cenário 4: Dashboard
  // ========================================================================
  const dashboardStart = Date.now();
  
  res = http.get(`${BASE_URL}/dashboard`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const dashboardSuccess = check(res, {
    'dashboard loaded': (r) => r.status === 200,
    'dashboard has content': (r) => r.body.includes('Dashboard') || r.body.includes('Painel'),
  });

  errorRate.add(!dashboardSuccess);
  dashboardDuration.add(Date.now() - dashboardStart);
  sleep(2);

  // ========================================================================
  // Cenário 5: Buscar Dados (Profile + PEIs)
  // ========================================================================
  res = http.get(
    'https://fximylewmvsllkdczovj.supabase.co/rest/v1/profiles?select=*',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY0NzIsImV4cCI6MjA3NzI3MjQ3Mn0.3FqQqUfVgD3hIh1daa3R1JjouGZ4D4ONR6SmcL9Qids',
      },
    }
  );

  check(res, {
    'profile loaded': (r) => r.status === 200 || r.status === 206,
  });

  sleep(1);
}

// Função de setup (executada uma vez no início)
export function setup() {
  console.log('🚀 Iniciando teste de carga do PEI Collab');
  console.log(`📊 Target: ${BASE_URL}`);
  console.log(`👥 Usuários virtuais: até 100 concorrentes`);
  console.log(`⏱️  Duração: 5 minutos`);
}

// Função de teardown (executada uma vez no final)
export function teardown(data) {
  console.log('✅ Teste de carga concluído!');
}

