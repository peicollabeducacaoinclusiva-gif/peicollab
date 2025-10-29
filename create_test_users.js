// Script para criar usuários de teste via Edge Function
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const testUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    email: 'superadmin@example.com',
    password: 'validpassword',
    fullName: 'Superadmin Teste',
    role: 'superadmin'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    email: 'education_secretary@example.com',
    password: 'validpassword',
    fullName: 'Secretário Educação Teste',
    role: 'education_secretary'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    email: 'school_director@example.com',
    password: 'validpassword',
    fullName: 'Diretor Escola Teste',
    role: 'school_director'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    email: 'coordinator@example.com',
    password: 'validpassword',
    fullName: 'Coordenador Teste',
    role: 'coordinator'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440014',
    email: 'school_manager@example.com',
    password: 'validpassword',
    fullName: 'Gestor Escola Teste',
    role: 'school_manager'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440015',
    email: 'aee_teacher@example.com',
    password: 'validpassword',
    fullName: 'Professor AEE Teste',
    role: 'aee_teacher'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440016',
    email: 'teacher@example.com',
    password: 'validpassword',
    fullName: 'Professor Teste',
    role: 'teacher'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440017',
    email: 'family@example.com',
    password: 'validpassword',
    fullName: 'Família Teste',
    role: 'family'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440018',
    email: 'specialist@example.com',
    password: 'validpassword',
    fullName: 'Especialista Teste',
    role: 'specialist'
  }
];

async function createTestUsers() {
  console.log('🚀 Criando usuários de teste...');
  
  for (const user of testUsers) {
    try {
      console.log(`📝 Criando usuário: ${user.email}`);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          tenantId: '550e8400-e29b-41d4-a716-446655440000'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Usuário ${user.email} criado com sucesso`);
      } else {
        const error = await response.text();
        console.log(`❌ Erro ao criar usuário ${user.email}:`, error);
      }
    } catch (error) {
      console.log(`❌ Erro ao criar usuário ${user.email}:`, error.message);
    }
  }
  
  console.log('🎉 Processo de criação de usuários concluído!');
}

// Executar se for chamado diretamente
if (typeof window === 'undefined') {
  createTestUsers();
}

export { createTestUsers, testUsers };
