import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

export interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
}

export function PageLayout({ children, title, subtitle, hideHeader = false }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {!hideHeader && title && <Header title={title} subtitle={subtitle} />}
      <main className="container py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
