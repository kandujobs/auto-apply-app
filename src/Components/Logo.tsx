import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '',
  onClick 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg',
    xl: 'w-12 h-12 text-xl'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div 
      className={`flex items-center space-x-2 ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0`}>
        <span className="text-white font-bold tracking-tight">K</span>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex-shrink-0`}>
          Kandu
        </span>
      )}
    </div>
  );
};

export default Logo;




