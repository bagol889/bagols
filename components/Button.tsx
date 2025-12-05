import React from 'react';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary'|'secondary'; isLoading?: boolean; }
export const Button: React.FC<ButtonProps> = ({ children, variant='primary', isLoading, className='', disabled, ...props }) => {
  const base = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
  const bg = variant === 'primary' ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-700 hover:bg-slate-600 text-white";
  return <button disabled={disabled||isLoading} className={`${base} ${bg} ${className} ${disabled?'opacity-50':''}`} {...props}>{isLoading?'...':children}</button>;
};
