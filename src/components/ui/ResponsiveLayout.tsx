import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  fullHeight?: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
  header,
  footer,
  sidebar,
  sidebarPosition = 'left',
  fullHeight = true
}) => {
  return (
    <div
      className={cn(
        'w-full overflow-x-hidden',
        fullHeight && 'min-h-screen min-h-dvh',
        className
      )}
    >
      {/* Header */}
      {header && (
        <header className="w-full sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {header}
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className={cn(
        'flex flex-col lg:flex-row w-full',
        fullHeight && 'min-h-[calc(100vh-80px)] min-h-[calc(100dvh-80px)]'
      )}>
        {/* Sidebar */}
        {sidebar && (
          <aside className={cn(
            'w-full lg:w-64 xl:w-72 flex-shrink-0',
            'bg-gray-50 border-r border-gray-200',
            'lg:sticky lg:top-20 lg:h-[calc(100vh-80px)]',
            'overflow-y-auto',
            sidebarPosition === 'right' && 'order-last'
          )}>
            <div className="p-4 lg:p-6">
              {sidebar}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={cn(
          'flex-1 w-full overflow-x-hidden',
          'min-h-[calc(100vh-80px)] min-h-[calc(100dvh-80px)]'
        )}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="w-full mt-auto bg-gray-50 border-t border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
};

export default ResponsiveLayout;
