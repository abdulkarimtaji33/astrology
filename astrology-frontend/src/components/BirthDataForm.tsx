'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useAuth } from '@/contexts/auth-context';

// ─── Types ─────────────────────────────────────────────────────────────────
interface CityResult {
  id: number;
  name: string;
  stateCode: string;
  countryCode: string;
  latitude: string;
  longitude: string;
  timezone: string;
}

// ─── Zod schema ────────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  birthDate: z.string().min(1, 'Birth date is required'),
  birthTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Use HH:mm format'),
});

type FormData = z.infer<typeof schema>;

// ─── Component ─────────────────────────────────────────────────────────────
export default function BirthDataForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  // City search state
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const citySearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Debounced city search
  const searchCities = useCallback((q: string) => {
    if (citySearchTimer.current) clearTimeout(citySearchTimer.current);
    if (q.trim().length < 2) { setCityResults([]); return; }
    citySearchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get<CityResult[]>('/cities/search', { params: { q, limit: 10 } });
        setCityResults(res.data);
        setShowDropdown(true);
      } catch {
        setCityResults([]);
      }
    }, 300);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onSubmit = async (data: FormData) => {
    setStatus('loading');
    setErrMsg('');
    try {
      const payload = {
        ...data,
        cityName: selectedCity ? `${selectedCity.name}, ${selectedCity.countryCode}` : undefined,
        latitude: selectedCity ? parseFloat(selectedCity.latitude) : undefined,
        longitude: selectedCity ? parseFloat(selectedCity.longitude) : undefined,
        timezone: selectedCity?.timezone ?? undefined,
      };
      const res = await api.post<{ id: number }>('/birth-records', payload);
      void qc.invalidateQueries({ queryKey: ['my-charts'] });
      router.push(`/chart/${res.data.id}`);
    } catch (e: unknown) {
      if (isAxiosError(e) && e.response?.status === 401) {
        setErrMsg('Session expired. Please sign in again.');
      } else {
        setErrMsg('Something went wrong. Please try again.');
      }
      setStatus('error');
    }
  };

  const inputClass =
    'app-input rounded-xl px-4 py-3 [color-scheme:light] dark:[color-scheme:dark]';

  if (authLoading) {
    return (
      <div className="flex h-64 w-full max-w-md animate-pulse flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/60 p-8 dark:border-white/10 dark:bg-white/[0.04]" />
    );
  }

  if (!user) {
    return (
      <div className="app-card flex w-full max-w-md flex-col gap-6 p-8">
        <div>
          <h2 className="text-xl font-medium tracking-wide text-slate-900 dark:text-white/95">
            Sign in required
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/55">
            Charts are private to your account. Sign in or register to create and open charts.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-amber-500 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="app-card flex w-full max-w-md flex-col gap-6 p-6 sm:p-8"
    >
      <div>
        <h2 className="text-xl font-medium tracking-wide text-slate-900 sm:text-2xl dark:text-white/95">
          Your birth details
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-white/60">Enter your birth data for a Vedic lagna chart.</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-white/80">
            Full name
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Jane Doe"
            {...register('name')}
            className={inputClass}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300/90">{errors.name.message}</p>
          )}
        </div>

        {/* Date & Time */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="birthDate" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-white/80">
              Birth date
            </label>
            <input
              id="birthDate"
              type="date"
              {...register('birthDate')}
              className={inputClass}
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300/90">{errors.birthDate.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="birthTime" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-white/80">
              Birth time
            </label>
            <input
              id="birthTime"
              type="time"
              {...register('birthTime')}
              className={inputClass}
            />
            {errors.birthTime && (
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300/90">{errors.birthTime.message}</p>
            )}
          </div>
        </div>

        {/* City search */}
        <div className="relative" ref={dropdownRef}>
          <label htmlFor="citySearch" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-white/80">
            Birth city
            <span className="ml-1 font-normal text-slate-500 dark:text-white/40">
              (optional — for accurate lagna)
            </span>
          </label>
          <input
            id="citySearch"
            type="text"
            placeholder="Type city name…"
            autoComplete="off"
            value={selectedCity ? `${selectedCity.name}, ${selectedCity.stateCode}, ${selectedCity.countryCode}` : cityQuery}
            onChange={(e) => {
              setSelectedCity(null);
              setCityQuery(e.target.value);
              searchCities(e.target.value);
            }}
            onFocus={() => { if (cityResults.length) setShowDropdown(true); }}
            className={inputClass}
          />

          {showDropdown && cityResults.length > 0 && (
            <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/15 dark:bg-slate-900">
              {cityResults.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    className="flex w-full items-baseline gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/10"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedCity(city);
                      setCityQuery('');
                      setShowDropdown(false);
                    }}
                  >
                    <span className="font-medium text-slate-900 dark:text-white">{city.name}</span>
                    <span className="text-xs text-slate-500 dark:text-white/40">
                      {city.stateCode}, {city.countryCode}
                      {city.timezone ? ` · ${city.timezone}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedCity && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-white/50">
              <span>
                lat {parseFloat(selectedCity.latitude).toFixed(4)}, lon{' '}
                {parseFloat(selectedCity.longitude).toFixed(4)}
              </span>
              <button
                type="button"
                onClick={() => { setSelectedCity(null); setCityQuery(''); }}
                className="text-amber-600 transition hover:text-amber-700 dark:text-amber-400/70 dark:hover:text-amber-400"
              >
                ✕ clear
              </button>
            </div>
          )}
        </div>
      </div>

      {status === 'error' && (
        <p className="rounded-lg bg-red-100 px-4 py-2 text-sm text-red-800 dark:bg-red-500/20 dark:text-red-200">
          {errMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="mt-2 rounded-xl bg-amber-500 px-6 py-3.5 font-medium text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
      >
        {status === 'loading' ? 'Generating chart…' : 'Generate Birth Chart →'}
      </button>
    </form>
  );
}
