import Link from 'next/link';
import { ReactNode, ButtonHTMLAttributes, MouseEventHandler } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  href?: string;
  loading?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  href,
  loading,
  className = '',
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5',
    secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-400 text-white shadow-lg shadow-secondary-500/30 hover:shadow-xl hover:shadow-secondary-500/40 hover:-translate-y-0.5',
    outline: 'border-2 border-primary-500 text-primary-400 hover:bg-primary-500/10',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/5',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };
  
  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;
  
  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick as MouseEventHandler<HTMLAnchorElement>}>
        {loading ? <span className="animate-spin mr-2">⏳</span> : null}
        {children}
      </Link>
    );
  }
  
  return (
    <button className={classes} disabled={disabled || loading} onClick={onClick as MouseEventHandler<HTMLButtonElement>} {...props}>
      {loading ? <span className="animate-spin mr-2">⏳</span> : null}
      {children}
    </button>
  );
}
