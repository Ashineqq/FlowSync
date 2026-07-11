import { useAtom, useAtomValue } from 'jotai';
import { userAtom, tokenAtom, isLoggedInAtom, isLeaderAtom } from '@/store/atoms';
import type { User } from '@/types';

/**
 * Standalone: reads user from sessionStorage.
 * Safe to call outside React tree (e.g. router loaders).
 */
export function getAuthUser(): User | null {
  try {
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? (JSON.parse(userStr) as User) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useAtom(userAtom);
  const [, setToken] = useAtom(tokenAtom);
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const isLeader = useAtomValue(isLeaderAtom);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setToken(token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return { user, isLoggedIn, isLeader, login, logout };
}
