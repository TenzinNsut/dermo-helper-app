
import React from 'react';
import { cn } from '@/lib/utils';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled,
  ...props
}) => {
  const variantClasses = {
    primary:
      'bg-blue-600 hover:bg-blue-500 text-white font-bold border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all',
    secondary:
      'bg-yellow-300 hover:bg-yellow-200 text-black font-bold border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all',
    outline:
      'bg-white hover:bg-slate-100 text-black font-bold border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all',
    ghost:
      'bg-transparent hover:bg-black hover:text-white text-black font-bold border-2 border-transparent hover:border-black transition-all',
  };

  const sizeClasses = {
    sm: 'h-9 px-3 text-xs rounded-none sm:rounded-md',
    md: 'h-10 px-4 py-2 text-sm rounded-none sm:rounded-md',
    lg: 'h-12 px-6 py-3 text-base rounded-none sm:rounded-md',
  };

  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center font-medium transition-colors focus-ring',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg 
            className="animate-spin h-5 w-5" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" cy="12" r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
      
      <span className={`flex items-center gap-2 ${loading ? 'invisible' : ''}`}>
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </span>
    </button>
  );
};

export default ActionButton;
