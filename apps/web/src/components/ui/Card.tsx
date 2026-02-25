import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: 'primary' | 'secondary' | 'accent' | 'none';
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  hover = true,
  gradient = 'none',
  onClick,
}: CardProps) {
  const gradients = {
    primary: 'from-primary-500/10 to-transparent',
    secondary: 'from-secondary-500/10 to-transparent',
    accent: 'from-accent-500/10 to-transparent',
    none: '',
  };

  return (
    <motion.div
      whileHover={hover ? { scale: 1.02 } : undefined}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        bg-dark-800/50 backdrop-blur-sm
        border border-white/10
        hover:border-primary-500/30
        transition-all duration-300
        ${hover ? 'hover:shadow-lg hover:shadow-primary-500/5' : ''}
        ${className}
      `}
    >
      {gradient !== 'none' && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradients[gradient]} pointer-events-none`} />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`
        bg-gradient-to-br from-white/5 to-white/[0.02]
        backdrop-blur-xl
        border border-white/10
        rounded-2xl
        hover:border-primary-500/30
        hover:shadow-lg hover:shadow-primary-500/5
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}
