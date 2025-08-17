import React from 'react';
import Logo from './Logo';
import LogoSVG from './LogoSVG';

const LogoExamples: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Logo Usage Examples</h1>
      
      {/* Header Example */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Header Navigation</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex space-x-4">
              <button className="text-gray-600 hover:text-purple-600">Home</button>
              <button className="text-gray-600 hover:text-purple-600">Jobs</button>
              <button className="text-gray-600 hover:text-purple-600">Profile</button>
            </div>
          </div>
        </div>
      </div>

      {/* Different Sizes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Different Sizes</h2>
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <Logo size="sm" />
            <p className="text-xs text-gray-500 mt-1">Small</p>
          </div>
          <div className="text-center">
            <Logo size="md" />
            <p className="text-xs text-gray-500 mt-1">Medium</p>
          </div>
          <div className="text-center">
            <Logo size="lg" />
            <p className="text-xs text-gray-500 mt-1">Large</p>
          </div>
          <div className="text-center">
            <Logo size="xl" />
            <p className="text-xs text-gray-500 mt-1">Extra Large</p>
          </div>
        </div>
      </div>

      {/* Icon Only */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Icon Only (No Text)</h2>
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <Logo size="sm" showText={false} />
            <p className="text-xs text-gray-500 mt-1">Small Icon</p>
          </div>
          <div className="text-center">
            <Logo size="md" showText={false} />
            <p className="text-xs text-gray-500 mt-1">Medium Icon</p>
          </div>
          <div className="text-center">
            <Logo size="lg" showText={false} />
            <p className="text-xs text-gray-500 mt-1">Large Icon</p>
          </div>
        </div>
      </div>

      {/* SVG Version */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">SVG Version (Better Scalability)</h2>
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <LogoSVG size="sm" />
            <p className="text-xs text-gray-500 mt-1">Small SVG</p>
          </div>
          <div className="text-center">
            <LogoSVG size="md" />
            <p className="text-xs text-gray-500 mt-1">Medium SVG</p>
          </div>
          <div className="text-center">
            <LogoSVG size="lg" />
            <p className="text-xs text-gray-500 mt-1">Large SVG</p>
          </div>
        </div>
      </div>

      {/* Interactive Example */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Interactive Logo (Clickable)</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <Logo 
            size="lg" 
            onClick={() => alert('Logo clicked! Navigate to home.')}
            className="cursor-pointer hover:scale-105 transition-transform"
          />
          <p className="text-sm text-gray-600 mt-2">Click the logo above to see interaction</p>
        </div>
      </div>

      {/* Mobile Header Example */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Mobile Header Example</h2>
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <button className="text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoExamples;
