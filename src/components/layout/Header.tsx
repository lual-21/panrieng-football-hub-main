import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import plfaLogo from '@/assets/plfa-logo.jpeg';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, isAdmin } = useAuth();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 glass border-b border-border/50"
    >
      <div className="container py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={plfaLogo} 
              alt="PLFA Logo" 
              className="w-11 h-11 rounded-full object-cover shadow-glow"
            />
            <div>
              <h1 className="text-xl font-display tracking-wider text-foreground">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          
          <Link
            to={user ? '/admin' : '/auth'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-xs font-medium text-secondary-foreground"
          >
            <Shield className="w-3.5 h-3.5" />
            {isAdmin ? 'Admin' : 'Login'}
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
