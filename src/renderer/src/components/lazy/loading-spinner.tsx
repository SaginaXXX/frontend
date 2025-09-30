import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    height: '100%',
    width: '100%'
  }}>
    <div style={{
      width: '24px',
      height: '24px',
      border: '2px solid #e2e8f0',
      borderTop: '2px solid #3182ce',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);


