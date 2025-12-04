import { useAuth } from './useAuth';
import type { AuthUser } from '../types';

export function useUser(): AuthUser | null {
  const { user } = useAuth();
  return user;
}































