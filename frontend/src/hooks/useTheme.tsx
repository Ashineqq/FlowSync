import { useAtom } from 'jotai';
import { themeAtom } from '@/store/atoms';
import { useEffect } from 'react';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function useTheme() {
  const [theme, setTheme] = useAtom(themeAtom);

  // 每次 theme 变化时同步到 DOM
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme, setTheme };
}
