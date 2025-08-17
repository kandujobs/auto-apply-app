import React from 'react';
import Logo from './Logo';

interface HeaderProps {
  onLogoClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  onLogoClick, 
  children, 
  className = '' 
}) => {
  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 px-4 py-3 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Logo 
            size="md" 
            onClick={onLogoClick}
            className="hover:opacity-80 transition-opacity"
          />
        </div>
        
        {/* Right side content */}
        <div className="flex items-center space-x-4">
          {children}
        </div>
      </div>
    </header>
  );
};

export default Header;
