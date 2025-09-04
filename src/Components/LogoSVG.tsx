import React from 'react';

interface LogoSVGProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

const LogoSVG: React.FC<LogoSVGProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '',
  onClick 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48
  };

  return (
    <div 
      className={`flex items-center space-x-2 ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* SVG Logo Icon */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <svg 
          width={iconSizes[size]} 
          height={iconSizes[size]} 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="32" height="32" rx="6" fill="url(#gradient)"/>
          <text 
            x="16" 
            y="22" 
            fontFamily="Arial, sans-serif" 
            fontSize="18" 
            fontWeight="bold" 
            textAnchor="middle" 
            fill="white"
          >
            K
          </text>
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{stopColor: '#7C3AED'}}/>
              <stop offset="100%" style={{stopColor: '#2563EB'}}/>
            </linearGradient>
          </defs>
        </svg>
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

export default LogoSVG;




