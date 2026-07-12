import React from 'react';

type LoadingButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export const LoadingButton: React.FC<LoadingButtonProps> = ({ loading, children, className = '', disabled, ...props }) => (
  <button {...props} disabled={disabled || loading} className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}>
    {loading ? <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : children}
  </button>
);
