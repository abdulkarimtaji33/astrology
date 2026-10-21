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

  const inputClass = 'app-input [color-scheme:light] dark:[color-scheme:dark]';
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-white/80';
  const errClass = 'mt-1.5 text-sm text-red-600 dark:text-red-300';

  if (authLoading) {
    return <div className="skeleton h-96 w-full" />;
  }

  if (!user) {
    return (
      <div className="app-card flex w-full flex-col gap-5 p-6 sm:p-8" style={{ border: '1px solid var(--app-border)' }}>
        <div>
          <h2 className="text-2xl font-semibold">Start your chart</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/60">
            Charts are private to your account. Create a free account to generate and save charts.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="btn btn-primary min-h-12 flex-1">Create free account</Link>
          <Link href="/login" className="btn btn-secondary min-h-12 flex-1">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="app-card flex w-full flex-col gap-6 p-6 sm:p-8"
      style={{ border: '1px solid var(--app-border)' }}
      noValidate
    >
      <div>
        <h2 className="text-2xl font-semibold">Your birth details</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-white/60">
          The more exact the time, the more accurate your lagna.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="name" className={labelClass}>Full name</label>
          <input id="name" type="text" autoComplete="name" placeholder="e.g. Jane Doe" {...register('name')} className={inputClass} />
          {errors.name && <p className={errClass}>{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2">
          <div>
            <label htmlFor="birthDate" className={labelClass}>Birth date</label>
            <input id="birthDate" type="date" {...register('birthDate')} className={inputClass} />
            {errors.birthDate && <p className={errClass}>{errors.birthDate.message}</p>}
          </div>
          <div>
            <label htmlFor="birthTime" className={labelClass}>Birth time</label>
            <input id="birthTime" type="time" {...register('birthTime')} className={inputClass} />
            {errors.birthTime && <p className={errClass}>{errors.birthTime.message}</p>}
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <label htmlFor="citySearch" className={labelClass}>
            Birth city <span className="font-normal text-slate-500 dark:text-white/40">· for accurate lagna</span>
          </label>
          <div className="relative">
            <input
              id="citySearch"
              type="search"
              placeholder="Start typing a city…"
              autoComplete="off"
              value={selectedCity ? `${selectedCity.name}, ${selectedCity.stateCode}, ${selectedCity.countryCode}` : cityQuery}
              onChange={(e) => {
                setSelectedCity(null);
                setCityQuery(e.target.value);
                searchCities(e.target.value);
              }}
              onFocus={() => { if (cityResults.length) setShowDropdown(true); }}
              className={`${inputClass} pr-11`}
            />
            {(selectedCity || cityQuery) && (
              <button
                type="button"
                aria-label="Clear city"
                onClick={() => { setSelectedCity(null); setCityQuery(''); setCityResults([]); }}
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-500/10"
              >
                ✕
              </button>
            )}
          </div>

          {showDropdown && cityResults.length > 0 && (
            <ul className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-white/15 dark:bg-slate-900">
              {cityResults.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    className="flex min-h-12 w-full flex-col items-start justify-center rounded-xl px-3 py-2 text-left transition hover:bg-amber-500/10"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedCity(city);
                      setCityQuery('');
                      setShowDropdown(false);
                    }}
                    onClick={() => {
                      setSelectedCity(city);
                      setCityQuery('');
                      setShowDropdown(false);
                    }}
                  >
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{city.name}</span>
                    <span className="text-xs text-slate-500 dark:text-white/45">
                      {city.stateCode}, {city.countryCode}
                      {city.timezone ? ` · ${city.timezone}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedCity && (
            <p className="chip mt-2">
              ✓ {parseFloat(selectedCity.latitude).toFixed(2)}°, {parseFloat(selectedCity.longitude).toFixed(2)}°
              {selectedCity.timezone ? ` · ${selectedCity.timezone}` : ''}
            </p>
          )}
        </div>
      </div>

      {status === 'error' && (
        <p role="alert" className="rounded-xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-200">
          {errMsg}
        </p>
      )}

      <button type="submit" disabled={status === 'loading'} className="btn btn-primary btn-block min-h-12 text-base">
        {status === 'loading' ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/40 border-t-slate-900" />
            Reading the stars…
          </>
        ) : (
          <>Generate birth chart →</>
        )}
      </button>
    </form>
  );
}
