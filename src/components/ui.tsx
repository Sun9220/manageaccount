import type { PropsWithChildren } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';

export const Card = ({ children }: PropsWithChildren) => <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">{children}</div>;

export const Button = ({ children, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) => (
  <button className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400" {...props}>
    {children}
  </button>
);

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" {...props} />
);

export const Select = ({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" {...props}>
    {children}
  </select>
);
