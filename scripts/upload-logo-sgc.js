// Script para Upload da Logo de São Gonçalo dos Campos
// Faz upload para Supabase Storage
// Data: 06/11/2024

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ====================================
// CONFIGURAÇÕES
// ====================================

const SUPABASE_URL = 'https://fximylewmvsllkdczovj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY5NjQ3MiwiZXhwIjoyMDc3MjcyNDcyfQ.ezYPOGMO2ik-VaiNoBrJ7cKivms3SiZsJ5zN0Fhm3Fg';

const LOGO_PATH = path.join(__dirname, '..', 'public', 'logo_sgc.png');
const BUCKET_NAME = 'school-logos';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ====================================
// FUNÇÃO PRINCIPAL
// ====================================

async function uploadLogoSGC() {
  console.log('🏛️  UPLOAD DA LOGO - SÃO GONÇALO DOS CAMPOS');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Verificar se logo existe
    console.log('📁 Verificando arquivo da logo...');
    if (!fs.existsSync(LOGO_PATH)) {
      throw new Error(`Logo não encontrada em: ${LOGO_PATH}`);
    }
    console.log('✅ Logo encontrada\n');

    // 2. Buscar tenant de São Gonçalo
    console.log('🔍 Buscando rede de São Gonçalo...');
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, network_name')
      .ilike('network_name', '%São Gonçalo%');

    if (tenantError) throw tenantError;

    if (!tenants || tenants.length === 0) {
      throw new Error('Rede de São Gonçalo não encontrada');
    }

    const tenant = tenants[0];
    console.log(`✅ Rede: ${tenant.network_name}`);
    console.log(`   ID: ${tenant.id}\n`);

    // 3. Criar bucket se não existir
    console.log('🪣 Verificando bucket...');
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log('  📦 Criando bucket "school-logos"...');
      const { error: bucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
      });

      if (bucketError) throw bucketError;
      console.log('  ✅ Bucket criado\n');
    } else {
      console.log('✅ Bucket já existe\n');
    }

    // 4. Remover logo anterior (se existir)
    console.log('🗑️  Limpando logos antigas...');
    const { data: existingFiles } = await supabase.storage
      .from(BUCKET_NAME)
      .list(tenant.id);

    if (existingFiles && existingFiles.length > 0) {
      const filesToRemove = existingFiles.map((file) => `${tenant.id}/${file.name}`);
      await supabase.storage.from(BUCKET_NAME).remove(filesToRemove);
      console.log(`  🗑️  ${existingFiles.length} arquivo(s) removido(s)\n`);
    } else {
      console.log('  ✅ Nenhuma logo antiga encontrada\n');
    }

    // 5. Upload da nova logo
    console.log('⬆️  Fazendo upload da logo...');
    const logoBuffer = fs.readFileSync(LOGO_PATH);
    const filePath = `${tenant.id}/logo.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, logoBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) throw uploadError;
    console.log('✅ Upload realizado com sucesso!\n');

    // 6. Obter URL pública
    console.log('🔗 Gerando URL pública...');
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('✅ URL da logo:');
    console.log(`   ${urlData.publicUrl}\n`);

    // 7. Sucesso final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCESSO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏛️  Logo do brasão de São Gonçalo carregada!');
    console.log('📍 Storage: school-logos/' + tenant.id + '/logo.png');
    console.log('🌐 URL pública: ' + urlData.publicUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 PRÓXIMO PASSO:');
    console.log('   A logo agora aparecerá automaticamente em:');
    console.log('   ✅ Impressões de PEI via sistema web');
    console.log('   ✅ Cabeçalho do dashboard');
    console.log('   ✅ PDFs gerados pelo sistema\n');

    console.log('🔄 Para usar o PrintPEIDialog (layout correto):');
    console.log('   1. Acesse o sistema web');
    console.log('   2. Login como coordenador');
    console.log('   3. Abra cada PEI e clique "Imprimir"');
    console.log('   4. Salve como PDF (Ctrl+P)\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  }
}

uploadLogoSGC();

