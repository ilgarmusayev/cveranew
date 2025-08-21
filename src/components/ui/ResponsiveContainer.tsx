import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  forceFullWidth?: boolean;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  as: Component = 'div',
  maxWidth = 'full',
  padding = 'md',
  forceFullWidth = true
}) => {
  const maxWidthClasses = {
    sm: forceFullWidth ? 'w-full' : 'max-w-screen-sm',
    md: forceFullWidth ? 'w-full' : 'max-w-screen-md',
    lg: forceFullWidth ? 'w-full' : 'max-w-screen-lg',
    xl: forceFullWidth ? 'w-full' : 'max-w-screen-xl',
    '2xl': forceFullWidth ? 'w-full' : 'max-w-screen-2xl',
    '3xl': forceFullWidth ? 'w-full' : 'max-w-screen-3xl',
    '4xl': forceFullWidth ? 'w-full' : 'max-w-screen-4xl',
    full: 'w-full max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 sm:px-6',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-4 sm:px-6 lg:px-8 xl:px-12',
    xl: 'px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16'
  };

  return (
    <Component
      className={cn(
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        'overflow-x-hidden',
        forceFullWidth && 'lg:w-full lg:max-w-full xl:w-full xl:max-w-full 2xl:w-full 2xl:max-w-full',
        className
      )}
    >
      {children}
    </Component>
  );
};

export default ResponsiveContainer;
