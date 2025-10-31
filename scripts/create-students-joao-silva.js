import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envPath = join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.log('⚠️ Arquivo .env não encontrado');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Dados da escola Municipal João da Silva
const SCHOOL_ID = '00000000-0000-0000-0000-000000000002';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

// Lista de alunos de exemplo
const students = [
  {
    name: 'Ana Clara Santos',
    date_of_birth: '2015-03-15',
    father_name: 'João Santos',
    mother_name: 'Maria Santos',
    phone: '(71) 98888-1234',
    email: 'ana.clara@exemplo.com',
    special_needs: 'TDAH',
    special_needs_description: 'Transtorno de Déficit de Atenção e Hiperatividade'
  },
  {
    name: 'Pedro Henrique Oliveira',
    date_of_birth: '2014-08-22',
    father_name: 'Carlos Oliveira',
    mother_name: 'Sandra Oliveira',
    phone: '(71) 97777-5678',
    email: 'pedro.henrique@exemplo.com',
    special_needs: 'Autismo',
    special_needs_description: 'Transtorno do Espectro Autista (TEA) nível 1'
  },
  {
    name: 'Mariana Costa Lima',
    date_of_birth: '2016-01-10',
    father_name: 'Roberto Lima',
    mother_name: 'Fernanda Costa',
    phone: '(71) 96666-9012',
    email: 'mariana.costa@exemplo.com',
    special_needs: 'Deficiência Intelectual',
    special_needs_description: 'Deficiência intelectual leve'
  },
  {
    name: 'Lucas Martins Silva',
    date_of_birth: '2015-11-05',
    father_name: 'Antônio Silva',
    mother_name: 'Juliana Martins',
    phone: '(71) 95555-3456',
    email: 'lucas.martins@exemplo.com',
    special_needs: 'Síndrome de Down',
    special_needs_description: 'Síndrome de Down'
  },
  {
    name: 'Sofia Almeida Rodrigues',
    date_of_birth: '2014-06-18',
    father_name: 'Paulo Rodrigues',
    mother_name: 'Camila Almeida',
    phone: '(71) 94444-7890',
    email: 'sofia.almeida@exemplo.com',
    special_needs: 'Deficiência Visual',
    special_needs_description: 'Baixa visão'
  },
  {
    name: 'Gabriel Ferreira Souza',
    date_of_birth: '2015-09-30',
    father_name: 'Marcos Souza',
    mother_name: 'Patrícia Ferreira',
    phone: '(71) 93333-2345',
    email: 'gabriel.ferreira@exemplo.com',
    special_needs: 'Deficiência Auditiva',
    special_needs_description: 'Perda auditiva unilateral'
  },
  {
    name: 'Isabella Rocha Pereira',
    date_of_birth: '2016-04-25',
    father_name: 'Rafael Pereira',
    mother_name: 'Amanda Rocha',
    phone: '(71) 92222-6789',
    email: 'isabella.rocha@exemplo.com',
    special_needs: 'TDAH',
    special_needs_description: 'Transtorno de Déficit de Atenção e Hiperatividade'
  },
  {
    name: 'Rafael Barbosa Gomes',
    date_of_birth: '2014-12-08',
    father_name: 'Felipe Gomes',
    mother_name: 'Bianca Barbosa',
    phone: '(71) 91111-0123',
    email: 'rafael.barbosa@exemplo.com',
    special_needs: 'Autismo',
    special_needs_description: 'Transtorno do Espectro Autista (TEA) nível 2'
  },
  {
    name: 'Larissa Moreira Castro',
    date_of_birth: '2015-07-14',
    father_name: 'Daniel Castro',
    mother_name: 'Tatiane Moreira',
    phone: '(71) 90000-4567',
    email: 'larissa.moreira@exemplo.com',
    special_needs: 'Deficiência Física',
    special_needs_description: 'Paralisia cerebral leve'
  },
  {
    name: 'Thiago Nascimento Carvalho',
    date_of_birth: '2016-02-28',
    father_name: 'André Carvalho',
    mother_name: 'Renata Nascimento',
    phone: '(71) 98888-8901',
    email: 'thiago.nascimento@exemplo.com',
    special_needs: 'TDAH',
    special_needs_description: 'Transtorno de Déficit de Atenção e Hiperatividade'
  }
];

async function createStudents() {
  console.log('🎓 Criando alunos para a Escola Municipal João da Silva...\n');

  try {
    // Verificar se a escola existe
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .eq('id', SCHOOL_ID)
      .single();

    if (schoolError || !school) {
      console.error('❌ Erro ao buscar escola:', schoolError?.message || 'Escola não encontrada');
      return;
    }

    console.log(`✅ Escola encontrada: ${school.school_name}`);
    console.log(`📚 Total de alunos a criar: ${students.length}\n`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const student of students) {
      try {
        // Verificar se o aluno já existe
        const { data: existingStudent } = await supabase
          .from('students')
          .select('id, name')
          .eq('school_id', SCHOOL_ID)
          .eq('name', student.name)
          .single();

        if (existingStudent) {
          console.log(`⏭️  ${student.name} - já existe`);
          updated++;
          continue;
        }

        // Criar aluno
        const studentData = {
          name: student.name,
          date_of_birth: student.date_of_birth,
          father_name: student.father_name,
          mother_name: student.mother_name,
          phone: student.phone,
          email: student.email,
          school_id: SCHOOL_ID,
          tenant_id: TENANT_ID,
          is_active: true
        };

        const { data: newStudent, error: insertError } = await supabase
          .from('students')
          .insert(studentData)
          .select();

        if (insertError) {
          console.error(`❌ Erro ao criar ${student.name}:`, insertError.message);
          errors++;
          continue;
        }

        console.log(`✅ ${student.name} - criado com sucesso`);
        created++;

        // Aguardar um pouco para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Erro ao processar ${student.name}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`   Total de alunos: ${students.length}`);
    console.log(`   ✅ Criados: ${created}`);
    console.log(`   ⏭️  Já existiam: ${updated}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log('\n🎉 Processo concluído!');

    // Mostrar total de alunos da escola
    const { data: allStudents, error: countError } = await supabase
      .from('students')
      .select('id')
      .eq('school_id', SCHOOL_ID);

    if (!countError) {
      console.log(`\n📚 Total de alunos na escola "${school.school_name}": ${allStudents?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error(error);
  }
}

createStudents();

