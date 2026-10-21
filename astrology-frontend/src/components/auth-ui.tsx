'use client';

import { useState, type ReactNode } from 'react';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-16">
      <div className="fade-up w-full max-w-md">{children}</div>
    </div>
  );
}

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="app-card w-full p-6 sm:p-9" style={{ border: '1px solid var(--app-border)' }}>
      <div className="mb-7 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 text-2xl text-slate-900 shadow-lg shadow-amber-500/30">
          ✦
        </span>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-white/55">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-white/80">
      {children}
    </label>
  );
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-200">
      <span aria-hidden>⚠</span>
      <span>{children}</span>
    </div>
  );
}

export function PasswordField({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  minLength,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder?: string;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="app-input pr-16"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-lg px-3 text-xs font-semibold text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

/** 0–4 strength score + label for the register screen. */
export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  const labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? colors[score] : 'bg-slate-400/25'}`} />
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-white/45">{labels[score]}</p>
    </div>
  );
}
