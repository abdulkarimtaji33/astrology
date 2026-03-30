/**
 * Chaldean / Pythagorean numerology utilities.
 * Lo Shu Grid  —  Driver (psychic) number  —  Conductor (destiny) number  —  Personal Year
 */

// ─── Lo Shu magic-square layout ─────────────────────────────────────────────
export const LO_SHU_GRID: number[][] = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

// ─── Number meanings ─────────────────────────────────────────────────────────
export const NUMBER_MEANING: Record<number, { title: string; keywords: string }> = {
  1: { title: 'The Leader',        keywords: 'Independence · Willpower · Originality' },
  2: { title: 'The Diplomat',      keywords: 'Sensitivity · Cooperation · Intuition' },
  3: { title: 'The Communicator',  keywords: 'Creativity · Expression · Joy' },
  4: { title: 'The Builder',       keywords: 'Stability · Discipline · Foundation' },
  5: { title: 'The Adventurer',    keywords: 'Freedom · Change · Versatility' },
  6: { title: 'The Nurturer',      keywords: 'Harmony · Love · Responsibility' },
  7: { title: 'The Seeker',        keywords: 'Spirituality · Wisdom · Introspection' },
  8: { title: 'The Achiever',      keywords: 'Power · Abundance · Ambition' },
  9: { title: 'The Humanitarian',  keywords: 'Compassion · Completion · Universal love' },
};

// ─── Chaldean letter values ──────────────────────────────────────────────────
// 9 is never assigned to a letter in Chaldean system
const CHALDEAN: Record<string, number> = {
  A:1, B:2, C:3, D:4, E:5, F:8, G:3, H:5, I:1,
  J:1, K:2, L:3, M:4, N:5, O:7, P:8, Q:1, R:2,
  S:3, T:4, U:6, V:6, W:6, X:5, Y:1, Z:7,
};

// ─── helpers ─────────────────────────────────────────────────────────────────
/** Repeatedly sum digits until single digit (1–9). */
export function reduceToSingle(n: number): number {
  while (n > 9) {
    n = String(n).split('').reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

/** Extract all non-zero digits from a padded date string DD MM YYYY. */
function birthDigits(day: number, month: number, year: number): number[] {
  return `${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}`
    .split('')
    .map(Number)
    .filter(d => d !== 0);
}

/** Calculate Chaldean name number. Returns compound total and reduced single digit. */
export function calculateNameNumber(name: string): { compound: number; single: number } {
  const total = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .reduce((sum, ch) => sum + (CHALDEAN[ch] ?? 0), 0);
  return { compound: total, single: reduceToSingle(total) };
}

// ─── public interfaces ────────────────────────────────────────────────────────
export interface LoShuCell {
  number:  number;
  count:   number;   // how many times it appears in the birth date
  present: boolean;
}

export interface NumerologyResult {
  driverNumber:    number;
  conductorNumber: number;
  personalYear:    number;
  targetYear:      number;
  digitCount:      Record<number, number>;
  loShuGrid:       LoShuCell[][];
  driverMeaning:    { title: string; keywords: string };
  conductorMeaning: { title: string; keywords: string };
  personalYearMeaning: { title: string; keywords: string };
  // name number (Chaldean)
  name:              string;
  nameCompound:      number;   // raw total before reduction
  nameNumber:        number;   // reduced single digit
  nameNumberMeaning: { title: string; keywords: string };
}

// ─── main function ────────────────────────────────────────────────────────────
export function calculateNumerology(
  day: number,
  month: number,
  year: number,
  targetYear: number = new Date().getFullYear(),
  name = '',
): NumerologyResult {
  // 1. Driver number — reduce birth day
  const driverNumber = reduceToSingle(day);

  // 2. Conductor number — sum all digits of full birth date, then reduce
  const digits = birthDigits(day, month, year);
  const conductorNumber = reduceToSingle(digits.reduce((s, d) => s + d, 0));

  // 3. Personal year — reduce(day) + reduce(month) + reduce(targetYear)
  const personalYear = reduceToSingle(
    reduceToSingle(day) + reduceToSingle(month) + reduceToSingle(targetYear),
  );

  // 4. Digit counts for Lo Shu (1–9 only)
  const digitCount: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 };
  for (const d of digits) {
    if (d >= 1 && d <= 9) digitCount[d]++;
  }

  // 5. Build 3×3 Lo Shu grid
  const loShuGrid: LoShuCell[][] = LO_SHU_GRID.map(row =>
    row.map(n => ({ number: n, count: digitCount[n], present: digitCount[n] > 0 })),
  );

  // 6. Name number (Chaldean)
  const { compound: nameCompound, single: nameNumber } = calculateNameNumber(name);

  return {
    driverNumber,
    conductorNumber,
    personalYear,
    targetYear,
    digitCount,
    loShuGrid,
    driverMeaning:       NUMBER_MEANING[driverNumber],
    conductorMeaning:    NUMBER_MEANING[conductorNumber],
    personalYearMeaning: NUMBER_MEANING[personalYear],
    name,
    nameCompound,
    nameNumber,
    nameNumberMeaning: NUMBER_MEANING[nameNumber] ?? NUMBER_MEANING[1],
  };
}
