import { type ReactNode } from 'react';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <Navigation />
      <main style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0, // Important for proper flex scrolling
      }}>
        {children}
      </main>
    </div>
  );
}
