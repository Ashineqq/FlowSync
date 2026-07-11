import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { User } from '@/types';

// ── 用户认证 ──

/** 当前登录用户（持久化到 sessionStorage，与 axios 拦截器读取源一致） */
export const userAtom = atomWithStorage<User | null>('currentUser', null, {
  getItem: (key) => {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },
  setItem: (key, value) => {
    if (value) {
      sessionStorage.setItem(key, JSON.stringify(value));
    } else {
      sessionStorage.removeItem(key);
    }
  },
  removeItem: (key) => sessionStorage.removeItem(key),
});

/** token（持久化到 sessionStorage） */
export const tokenAtom = atomWithStorage<string | null>('token', null, {
  getItem: (key) => sessionStorage.getItem(key),
  setItem: (key, value) => {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  },
  removeItem: (key) => sessionStorage.removeItem(key),
});

/** 是否已登录（派生状态） */
export const isLoggedInAtom = atom((get) => get(userAtom) !== null);

/** 是否为负责人（派生状态） */
export const isLeaderAtom = atom((get) => get(userAtom)?.role === '负责人');

// ── 主题 ──

type Theme = 'light' | 'dark';

export const themeAtom = atomWithStorage<Theme>('flowsync-theme', 'light', {
  getItem: (key) => {
    const raw = localStorage.getItem(key);
    if (raw === 'light' || raw === 'dark') return raw;
    // 回退到系统偏好
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
});
