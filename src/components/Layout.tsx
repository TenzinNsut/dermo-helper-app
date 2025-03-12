
import React, { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  fullHeight?: boolean;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  hideHeader = false, 
  fullHeight = false,
  className = "" 
}) => {
  return (
    <div className={`min-h-screen flex flex-col ${fullHeight ? 'h-screen' : ''}`}>
      {!hideHeader && <Header />}
      
      <main className={`flex-1 px-4 py-6 w-full max-w-4xl mx-auto flex flex-col ${className}`}>
        {children}
      </main>
      
      <footer className="py-3 px-4 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Skin Detection App</p>
      </footer>
    </div>
  );
};

export default Layout;
