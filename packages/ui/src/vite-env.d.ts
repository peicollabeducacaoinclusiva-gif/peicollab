/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_PEI_COLLAB_URL?: string
  readonly VITE_GESTAO_ESCOLAR_URL?: string
  readonly VITE_PLANO_AEE_URL?: string
  readonly VITE_PLANEJAMENTO_URL?: string
  readonly VITE_ATIVIDADES_URL?: string
  readonly VITE_BLOG_URL?: string
  readonly VITE_PORTAL_RESPONSAVEL_URL?: string
  readonly VITE_TRANSPORTE_ESCOLAR_URL?: string
  readonly VITE_MERENDA_ESCOLAR_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

