'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { saveRecentChart } from '@/components/RecentCharts';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

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
    try {
      const payload = {
        ...data,
        cityName: selectedCity ? `${selectedCity.name}, ${selectedCity.countryCode}` : undefined,
        latitude: selectedCity ? parseFloat(selectedCity.latitude) : undefined,
        longitude: selectedCity ? parseFloat(selectedCity.longitude) : undefined,
        timezone: selectedCity?.timezone ?? undefined,
      };
      const res = await api.post<{ id: number }>('/birth-records', payload);
      saveRecentChart({
        id: res.data.id,
        name: data.name,
        birthDate: data.birthDate,
        cityName: payload.cityName,
      });
      router.push(`/chart/${res.data.id}`);
    } catch {
      setStatus('error');
    }
  };

  const inputClass =
    'w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-3 text-white placeholder:text-white/35 transition focus:border-amber-400/70 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:bg-slate-900/80';

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md sm:p-8"
    >
      <div>
        <h2 className="text-xl font-medium tracking-wide text-white/95 sm:text-2xl">
          Your birth details
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Enter your birth data for a Vedic lagna chart.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-white/80">
            Full name
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Jane Doe"
            {...register('name')}
            className={inputClass}
          />
          {errors.name && <p className="mt-1 text-sm text-amber-300/90">{errors.name.message}</p>}
        </div>

        {/* Date & Time */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="birthDate" className="mb-1.5 block text-sm font-medium text-white/80">
              Birth date
            </label>
            <input
              id="birthDate"
              type="date"
              {...register('birthDate')}
              className={`${inputClass} [color-scheme:dark]`}
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-amber-300/90">{errors.birthDate.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="birthTime" className="mb-1.5 block text-sm font-medium text-white/80">
              Birth time
            </label>
            <input
              id="birthTime"
              type="time"
              {...register('birthTime')}
              className={`${inputClass} [color-scheme:dark]`}
            />
            {errors.birthTime && (
              <p className="mt-1 text-sm text-amber-300/90">{errors.birthTime.message}</p>
            )}
          </div>
        </div>

        {/* City search */}
        <div className="relative" ref={dropdownRef}>
          <label htmlFor="citySearch" className="mb-1.5 block text-sm font-medium text-white/80">
            Birth city
            <span className="ml-1 text-white/40 font-normal">(optional — for accurate lagna)</span>
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
            <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/15 bg-slate-900 shadow-2xl">
              {cityResults.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 transition flex items-baseline gap-2"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedCity(city);
                      setCityQuery('');
                      setShowDropdown(false);
                    }}
                  >
                    <span className="font-medium text-white">{city.name}</span>
                    <span className="text-white/40 text-xs">
                      {city.stateCode}, {city.countryCode}
                      {city.timezone ? ` · ${city.timezone}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedCity && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-white/50">
              <span>
                lat {parseFloat(selectedCity.latitude).toFixed(4)}, lon{' '}
                {parseFloat(selectedCity.longitude).toFixed(4)}
              </span>
              <button
                type="button"
                onClick={() => { setSelectedCity(null); setCityQuery(''); }}
                className="text-amber-400/70 hover:text-amber-400 transition"
              >
                ✕ clear
              </button>
            </div>
          )}
        </div>
      </div>

      {status === 'error' && (
        <p className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-200">
          Something went wrong. Please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="mt-2 rounded-xl bg-amber-400 px-6 py-3.5 font-medium text-slate-900 transition hover:bg-amber-300 disabled:opacity-60"
      >
        {status === 'loading' ? 'Generating chart…' : 'Generate Birth Chart →'}
      </button>
    </form>
  );
}
