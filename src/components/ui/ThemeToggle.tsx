'use client';

import { useTheme } from 'next-themes';
import React from 'react';

export const ThemeToggle: React.FC<{ className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => {
  const { theme, setTheme, systemTheme } = useTheme();
  const current = theme === 'system' ? systemTheme : theme;

  return (
    <button
      aria-label="Toggle theme"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors ${className}`}
      onClick={() => setTheme(current === 'dark' ? 'light' : 'dark')}
      {...props}
    >
      {current === 'dark' ? (
        // sun icon
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
      ) : (
        // moon icon
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      )}
    </button>
  );
};
