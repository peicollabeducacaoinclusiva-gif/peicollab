import type { Session } from '@supabase/supabase-js'

const AUTH_TOKEN_KEY = '@pei-collab:auth-token'

interface StoredAuthToken {
  access_token: string
  refresh_token: string
  expires_at: number
  user_id: string
}

/**
 * Salva o token de autenticação no localStorage para SSO entre apps
 */
export function saveAuthToken(session: Session | null): void {
  if (!session) {
    clearAuthToken()
    return
  }

  const tokenData: StoredAuthToken = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at || 0,
    user_id: session.user.id,
  }

  try {
    localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(tokenData))
    console.log('🔐 Token salvo para SSO entre apps')
  } catch (error) {
    console.error('Erro ao salvar token:', error)
  }
}

/**
 * Recupera o token de autenticação do localStorage
 */
export function getAuthToken(): StoredAuthToken | null {
  try {
    const stored = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!stored) return null

    const token = JSON.parse(stored) as StoredAuthToken
    
    // Validar se o token não está expirado
    if (!validateAuthToken(token)) {
      clearAuthToken()
      return null
    }

    return token
  } catch (error) {
    console.error('Erro ao recuperar token:', error)
    return null
  }
}

/**
 * Remove o token de autenticação do localStorage
 */
export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    console.log('🔓 Token removido (logout)')
  } catch (error) {
    console.error('Erro ao limpar token:', error)
  }
}

/**
 * Valida se o token ainda é válido (não expirado)
 */
export function validateAuthToken(token: StoredAuthToken | null): boolean {
  if (!token) return false

  const now = Math.floor(Date.now() / 1000)
  const expiresAt = token.expires_at

  // Token expira em menos de 5 minutos? Considerar inválido para forçar refresh
  const bufferTime = 5 * 60 // 5 minutos em segundos
  const isValid = expiresAt > (now + bufferTime)

  if (!isValid) {
    console.log('⚠️ Token expirado ou prestes a expirar')
  }

  return isValid
}

/**
 * Hook para usar token de autenticação em React components
 */
export function useAuthToken() {
  return {
    saveAuthToken,
    getAuthToken,
    clearAuthToken,
    validateAuthToken,
  }
}

