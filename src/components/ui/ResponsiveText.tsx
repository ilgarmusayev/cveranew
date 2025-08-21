import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption';
  className?: string;
  as?: React.ElementType;
}

const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  variant = 'body',
  className,
  as
}) => {
  const variantClasses = {
    h1: 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight',
    h2: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold leading-tight',
    h3: 'text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold leading-snug',
    h4: 'text-base sm:text-lg lg:text-xl xl:text-2xl font-medium leading-snug',
    h5: 'text-sm sm:text-base lg:text-lg xl:text-xl font-medium leading-normal',
    h6: 'text-xs sm:text-sm lg:text-base xl:text-lg font-medium leading-normal',
    body: 'text-sm sm:text-base lg:text-lg leading-relaxed',
    caption: 'text-xs sm:text-sm leading-normal text-gray-600'
  };

  const defaultElements = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    body: 'p',
    caption: 'span'
  };

  const Component = as || defaultElements[variant] as React.ElementType;

  return (
    <Component
      className={cn(
        variantClasses[variant],
        'break-words hyphens-auto',
        className
      )}
    >
      {children}
    </Component>
  );
};

export default ResponsiveText;
