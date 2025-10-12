// criarUsuario.js
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// ⚙️ Cria o cliente Supabase usando as variáveis do .env
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'professor@teste.com',
    password: '12345678',
    email_confirm: true,
    user_metadata: {
      full_name: 'Maria Silva',
      role: 'teacher',
      tenant_id: '6c96ef89-6e89-4c61-9d8a-0b4f836ba2f1'
    }
  })

  console.log({ data, error })
}

main()
