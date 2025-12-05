import React from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }
export const Input: React.FC<InputProps> = ({ label, error, className='', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>}
    <input className={`w-full px-3 py-2 bg-slate-800 border ${error?'border-red-500':'border-slate-700'} rounded-md text-white focus:ring-2 focus:ring-indigo-500 outline-none ${className}`} {...props} />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);
