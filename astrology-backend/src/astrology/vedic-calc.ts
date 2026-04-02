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

function getDignity(planet: PlanetName, sign: SignName): string[] {
  const result: string[] = [];
  if (EXALTATION[planet] === sign) result.push('exalted');
  if (DEBILITATION[planet] === sign) result.push('debilitated');
  if (SIGN_LORDS[sign] === planet) result.push('own');
  return result.length > 0 ? result : ['neutral'];
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
  dignity: string[];
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

// ─── Vimshottari Mahadasha ────────────────────────────────────────────────────

/** Sequence and years for Vimshottari Dasha (total = 120 years) */
const DASHA_SEQUENCE: { planet: PlanetName; years: number }[] = [
  { planet: 'Ketu',    years: 7  },
  { planet: 'Venus',   years: 20 },
  { planet: 'Sun',     years: 6  },
  { planet: 'Moon',    years: 10 },
  { planet: 'Mars',    years: 7  },
  { planet: 'Rahu',    years: 18 },
  { planet: 'Jupiter', years: 16 },
  { planet: 'Saturn',  years: 19 },
  { planet: 'Mercury', years: 17 },
];

/**
 * 27 Nakshatras (0-indexed) with their dasha lords.
 * Each nakshatra spans 13°20' (= 360/27).
 */
const NAKSHATRA_LORDS: PlanetName[] = [
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury', // 0-8
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury', // 9-17
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury', // 18-26
];

const NAKSHATRA_NAMES = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha',
  'Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati',
];

export interface DashaPeriod {
  planet: PlanetName;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  years: number;
  isCurrent: boolean;
}

export interface MahadashaResult {
  moonNakshatra: string;
  moonNakshatraIndex: number;
  moonLongitude: number;
  dashaLordAtBirth: PlanetName;
  periods: DashaPeriod[];
}

/** Add fractional years to a Date, returns new Date */
function addYears(date: Date, years: number): Date {
  const ms = years * 365.25 * 24 * 60 * 60 * 1000;
  return new Date(date.getTime() + ms);
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function calculateMahadasha(
  moonLongitude: number,
  birthDate: Date,
): MahadashaResult {
  const NAKSHATRA_SPAN = 360 / 27; // 13.333...°

  const nakshatraIndex = Math.floor(moonLongitude / NAKSHATRA_SPAN);
  const degreeInNakshatra = moonLongitude % NAKSHATRA_SPAN;
  const fractionRemaining = 1 - degreeInNakshatra / NAKSHATRA_SPAN;

  const dashaLord = NAKSHATRA_LORDS[nakshatraIndex];
  const dashaEntry = DASHA_SEQUENCE.find(d => d.planet === dashaLord)!;

  // Years remaining in the birth dasha
  const yearsRemaining = dashaEntry.years * fractionRemaining;

  // Build full sequence starting from the birth dasha
  const startIndex = DASHA_SEQUENCE.findIndex(d => d.planet === dashaLord);
  const now = new Date();

  const periods: DashaPeriod[] = [];
  let cursor = new Date(birthDate);

  // First period: only the remaining portion
  const firstEnd = addYears(cursor, yearsRemaining);
  periods.push({
    planet:    dashaLord,
    startDate: toDateStr(cursor),
    endDate:   toDateStr(firstEnd),
    years:     parseFloat(yearsRemaining.toFixed(2)),
    isCurrent: cursor <= now && now < firstEnd,
  });
  cursor = firstEnd;

  // Subsequent full periods — enough to cover ~120 years from birth
  for (let i = 1; i < 9 * 3; i++) {
    const entry = DASHA_SEQUENCE[(startIndex + i) % 9];
    const end = addYears(cursor, entry.years);
    periods.push({
      planet:    entry.planet,
      startDate: toDateStr(cursor),
      endDate:   toDateStr(end),
      years:     entry.years,
      isCurrent: cursor <= now && now < end,
    });
    cursor = end;
    // Stop after covering 120 years from birth
    if (cursor.getTime() - birthDate.getTime() > 120 * 365.25 * 24 * 60 * 60 * 1000) break;
  }

  return {
    moonNakshatra:      NAKSHATRA_NAMES[nakshatraIndex],
    moonNakshatraIndex: nakshatraIndex,
    moonLongitude,
    dashaLordAtBirth:   dashaLord,
    periods,
  };
}

// ─── transit calculation ─────────────────────────────────────────────────────
/**
 * Calculate sidereal planetary positions for a given UTC date (at noon).
 * Houses are mapped relative to lagnaSignIndex if supplied (≥ 0), otherwise house = 0.
 */
export function calculateTransitPlanets(
  year: number, month: number, day: number,
  lagnaSignIndex = -1,
): PlanetPosition[] {
  const jd = swe.swe_julday(year, month, day, 12.0, 1 /* Gregorian */);
  swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
  const flags = swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED;
  const positions: PlanetPosition[] = [];

  for (const planet of PLANETS) {
    let longitude: number;
    let speed: number;

    if (planet === 'Ketu') {
      const rahu = positions.find(p => p.planet === 'Rahu')!;
      longitude = norm360(rahu.longitude + 180);
      speed = 0;
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
    const isRetrograde = planet === 'Rahu' || planet === 'Ketu' ? true : speed < 0;
    const house = lagnaSignIndex >= 0 ? ((signIndex - lagnaSignIndex + 12) % 12) + 1 : 0;

    positions.push({
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

  return positions;
}
