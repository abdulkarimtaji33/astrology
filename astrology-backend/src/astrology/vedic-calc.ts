/**
 * Vedic (Jyotish) astrology calculator using Swiss Ephemeris (swisseph-v2).
 * - Ayanamsa : Lahiri (Chitrapaksha) — SE_SIDM_LAHIRI
 * - House system: Whole-sign equal houses from Lagna
 * - Time input : local birth time + IANA timezone → UTC internally
 */

import { DateTime } from 'luxon';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const swe = require('swisseph-v2') as SwissEph;

// ─── Swiss Ephemeris type shim ────────────────────────────────────────────
interface SweResult { longitude: number; latitude: number; distance: number; longitudeSpeed: number; error?: string; }
interface SweHousesResult { house: number[]; ascendant: number; mc: number; armc: number; vertex: number; equatorialAscendant: number; error?: string; }
interface SwissEph {
  SE_SUN: number; SE_MOON: number; SE_MERCURY: number; SE_VENUS: number;
  SE_MARS: number; SE_JUPITER: number; SE_SATURN: number;
  SE_MEAN_NODE: number; SE_TRUE_NODE: number;
  SEFLG_SIDEREAL: number; SEFLG_SPEED: number; SEFLG_TRUEPOS: number;
  SE_SIDM_LAHIRI: number;
  swe_set_sid_mode(mode: number, t0: number, ayan_t0: number): void;
  swe_calc_ut(tjd_ut: number, ipl: number, iflag: number): SweResult;
  swe_houses(tjd_ut: number, geolat: number, geolon: number, hsys: string): SweHousesResult;
  swe_julday(year: number, month: number, day: number, hour: number, gregflag: number): number;
  swe_deltat(tjd: number): number;
  swe_set_ephe_path(path: string): void;
}

// ─── constants ──────────────────────────────────────────────────────────
export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export const PLANETS = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Rahu', 'Ketu',
] as const;

export type PlanetName = typeof PLANETS[number];
export type SignName   = typeof SIGNS[number];

const SWE_ID: Record<PlanetName, number> = {
  Sun     : swe.SE_SUN,
  Moon    : swe.SE_MOON,
  Mercury : swe.SE_MERCURY,
  Venus   : swe.SE_VENUS,
  Mars    : swe.SE_MARS,
  Jupiter : swe.SE_JUPITER,
  Saturn  : swe.SE_SATURN,
  Rahu    : swe.SE_MEAN_NODE,
  Ketu    : -1, // derived from Rahu + 180°
};

const SIGN_LORDS: Record<string, PlanetName> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

const EXALTATION: Partial<Record<PlanetName, string>> = {
  Sun: 'Aries', Moon: 'Taurus', Mercury: 'Virgo', Venus: 'Pisces',
  Mars: 'Capricorn', Jupiter: 'Cancer', Saturn: 'Libra',
  Rahu: 'Gemini', Ketu: 'Sagittarius',
};

const DEBILITATION: Partial<Record<PlanetName, string>> = {
  Sun: 'Libra', Moon: 'Scorpio', Mercury: 'Pisces', Venus: 'Virgo',
  Mars: 'Cancer', Jupiter: 'Capricorn', Saturn: 'Aries',
  Rahu: 'Sagittarius', Ketu: 'Gemini',
};

// ─── helpers ────────────────────────────────────────────────────────────
function norm360(x: number) { return ((x % 360) + 360) % 360; }

function getDignity(planet: PlanetName, sign: SignName): 'own' | 'exalted' | 'debilitated' | 'neutral' {
  if (SIGN_LORDS[sign] === planet) return 'own';
  if (EXALTATION[planet] === sign) return 'exalted';
  if (DEBILITATION[planet] === sign) return 'debilitated';
  return 'neutral';
}

/**
 * Convert local birth time + IANA timezone → UTC components.
 * Luxon handles historical offsets (LMT, DST transitions) correctly.
 * Falls back to treating the input as UTC if timezone is missing/invalid.
 */
export function localToUtc(
  year: number, month: number, day: number,
  hour: number, minute: number, second: number,
  ianaTimezone: string,
): { year: number; month: number; day: number; hour: number; minute: number; second: number; utcOffsetHours: number } {
  const local = DateTime.fromObject(
    { year, month, day, hour, minute, second },
    { zone: ianaTimezone || 'UTC' },
  );
  const utcOffsetHours = (local.isValid ? local.offset : 0) / 60;
  const utc = local.isValid ? local.toUTC() : DateTime.utc(year, month, day, hour, minute, second);
  return {
    year  : utc.year,
    month : utc.month,
    day   : utc.day,
    hour  : utc.hour,
    minute: utc.minute,
    second: utc.second,
    utcOffsetHours,
  };
}

// ─── public interfaces ───────────────────────────────────────────────────
export interface PlanetPosition {
  planet: PlanetName;
  longitude: number;
  sign: SignName;
  signIndex: number;
  degreeInSign: number;
  house: number;
  isRetrograde: boolean;
  dignity: 'own' | 'exalted' | 'debilitated' | 'neutral';
}

export interface LagnaChart {
  lagna: {
    longitude: number;
    sign: SignName;
    signIndex: number;
    degreeInSign: number;
  };
  planets: PlanetPosition[];
  houses: { house: number; sign: SignName; signIndex: number; planets: PlanetName[] }[];
  ayanamsa: number;
  julianDay: number;
  utcOffsetHours: number;
}

// ─── main calculation ────────────────────────────────────────────────────
/**
 * @param year..second  LOCAL birth time (as recorded on the birth certificate)
 * @param lat / lon     Geographic coordinates of birth city (decimal degrees)
 * @param ianaTimezone  IANA timezone string, e.g. "Asia/Kolkata". Pass '' or undefined for UTC.
 */
export function calculateChart(
  year: number, month: number, day: number,
  hour: number, minute: number, second: number,
  lat: number, lon: number,
  ianaTimezone = '',
): LagnaChart {
  // 1. Convert local time → UTC
  let utc: ReturnType<typeof localToUtc>;
  if (ianaTimezone && ianaTimezone.trim() !== '') {
    utc = localToUtc(year, month, day, hour, minute, second, ianaTimezone);
  } else {
    utc = { year, month, day, hour, minute, second, utcOffsetHours: 0 };
  }

  const utHour = utc.hour + utc.minute / 60 + utc.second / 3600;

  // 2. Julian Day (UT)
  const jd = swe.swe_julday(utc.year, utc.month, utc.day, utHour, 1 /* Gregorian */);

  // 3. Set Lahiri ayanamsa
  swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);

  const flags = swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED;

  // 4. Compute ascendant using Swiss Ephemeris house system 'W' (whole sign)
  //    swe_houses returns tropical ascendant; we subtract ayanamsa for sidereal.
  //    Use 'P' (Placidus) to get accurate tropical ASC then convert to sidereal.
  const housesResult = swe.swe_houses(jd, lat, lon, 'P');
  if (housesResult.error) throw new Error(`swe_houses: ${housesResult.error}`);

  // Derive ayanamsa: compute Sun in both tropical and sidereal mode, difference = ayanamsa
  const sunSid = swe.swe_calc_ut(jd, swe.SE_SUN, flags);
  const sunTrop = swe.swe_calc_ut(jd, swe.SE_SUN, swe.SEFLG_SPEED);
  const ayanamsaDeg = norm360(sunTrop.longitude - sunSid.longitude);

  const tropAsc = housesResult.ascendant;
  const siderealAsc = norm360(tropAsc - ayanamsaDeg);
  const lagnaSignIndex = Math.floor(siderealAsc / 30);
  const lagnaSign = SIGNS[lagnaSignIndex];

  // 5. Compute planet sidereal longitudes
  const planetPositions: PlanetPosition[] = [];

  for (const planet of PLANETS) {
    let longitude: number;
    let speed: number;

    if (planet === 'Ketu') {
      const rahu = planetPositions.find(p => p.planet === 'Rahu')!;
      longitude = norm360(rahu.longitude + 180);
      speed = 0; // Ketu always moves with Rahu (retrograde by convention)
    } else {
      const sweId = SWE_ID[planet];
      const result = swe.swe_calc_ut(jd, sweId, flags);
      if (result.error) throw new Error(`swe_calc_ut ${planet}: ${result.error}`);
      longitude = result.longitude;
      speed = result.longitudeSpeed;
    }

    const signIndex = Math.floor(longitude / 30);
    const sign = SIGNS[signIndex];
    const degreeInSign = longitude % 30;
    const house = ((signIndex - lagnaSignIndex + 12) % 12) + 1;
    // Retrograde: speed < 0 (Rahu/Ketu always retrograde by convention)
    const isRetrograde = planet === 'Rahu' || planet === 'Ketu' ? true : speed < 0;

    planetPositions.push({
      planet,
      longitude,
      sign,
      signIndex,
      degreeInSign,
      house,
      isRetrograde,
      dignity: getDignity(planet, sign),
    });
  }

  // 6. Build houses array (whole-sign, 12 houses from lagna)
  const houses = Array.from({ length: 12 }, (_, i) => {
    const houseSignIndex = (lagnaSignIndex + i) % 12;
    return {
      house: i + 1,
      sign: SIGNS[houseSignIndex],
      signIndex: houseSignIndex,
      planets: planetPositions
        .filter(p => p.house === i + 1)
        .map(p => p.planet),
    };
  });

  return {
    lagna: {
      longitude: siderealAsc,
      sign: lagnaSign,
      signIndex: lagnaSignIndex,
      degreeInSign: siderealAsc % 30,
    },
    planets: planetPositions,
    houses,
    ayanamsa: ayanamsaDeg,
    julianDay: jd,
    utcOffsetHours: utc.utcOffsetHours,
  };
}
