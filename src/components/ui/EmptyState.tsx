import React from 'react';

interface EmptyStateProps {
  message: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, className = '' }) => (
  <div className={`p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl ${className}`}>
    {message}
  </div>
);
