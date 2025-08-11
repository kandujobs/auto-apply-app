import React, { useEffect } from 'react';

interface NotificationProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ 
  message, 
  isVisible, 
  onClose, 
  duration = 2000 
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-40 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 border border-gray-200">
        <span className="text-green-500 text-sm">✓</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Notification; 