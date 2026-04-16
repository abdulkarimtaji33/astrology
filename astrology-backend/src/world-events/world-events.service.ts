import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { calculateTransitPlanets, PlanetPosition, PlanetName } from '../astrology/vedic-calc';

export interface WorldEventsMonthHighlight {
  periodLabel: string;
  outlook: string;
  focusAreas: string[];
}

export interface PlanetState {
  planet: PlanetName;
  sign: string;
  degree: number;
  isRetrograde: boolean;
  dignity: string;
}

export interface PlanetaryConjunction {
  planets: PlanetName[];
  sign: string;
  maxOrbDeg: number;
}

export interface PlanetaryAspect {
  fromPlanet: PlanetName;
  toPlanet: PlanetName;
  aspectType: string; // '7th' | '4th' | '8th' | '5th/9th' | 'Saturn 3rd/10th' | 'Jupiter 5th/9th' | 'Mars 4th/8th'
}

export interface CombustPlanet {
  planet: PlanetName;
  sign: string;
  orbFromSun: number;
}

export interface WorldEventsSnapshot {
  date: string;
  planets: PlanetState[];
  conjunctions: PlanetaryConjunction[];
  aspects: PlanetaryAspect[];
  combustions: CombustPlanet[];
}

export interface WorldEventsSignIngress {
  date: string;
  planet: PlanetName;
  fromSign: string;
  toSign: string;
}

export interface WorldEventsRetroStation {
  date: string;
  planet: PlanetName;
  toRetrograde: boolean;
}

export interface WorldEventsTopicAnalysis {
  topic: string;
  assessment: string;
}

export interface WorldEventsResult {
  summary: string;
  majorThemes: string[];
  topicAnalysis: WorldEventsTopicAnalysis[];
  monthlyHighlights: WorldEventsMonthHighlight[];
  disclaimer: string;
  snapshots: WorldEventsSnapshot[];
  signIngresses: WorldEventsSignIngress[];
  retrogradeStations: WorldEventsRetroStation[];
  aiPrompt: string;
  model: string;
}

// Combustion orbs in degrees (Sun proximity threshold)
const COMBUST_ORBS: Partial<Record<PlanetName, number>> = {
  Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15,
};

// Graha drishti (special aspects beyond the universal 7th)
// Key = planet, Value = additional house offsets from its position (7th is universal, excluded here)
const SPECIAL_ASPECTS: Partial<Record<PlanetName, number[]>> = {
  Mars:    [3, 7],   // 4th and 8th from Mars (7th + offsets 3,7 → houses 4,8 counted from Mars sign)
  Jupiter: [4, 8],   // 5th and 9th from Jupiter
  Saturn:  [2, 9],   // 3rd and 10th from Saturn
  Rahu:    [4, 8],   // Rahu aspects 5th and 9th (school-dependent; using Parashari)
  Ketu:    [4, 8],
};

function angularDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function computeConjunctions(planets: PlanetPosition[]): PlanetaryConjunction[] {
  const result: PlanetaryConjunction[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      if (a.signIndex === b.signIndex) {
        const orb = angularDiff(a.longitude, b.longitude);
        // Check if already captured in a group
        const existing = result.find(c => c.sign === a.sign && c.planets.includes(a.planet as PlanetName));
        if (existing) {
          if (!existing.planets.includes(b.planet as PlanetName)) {
            existing.planets.push(b.planet as PlanetName);
            existing.maxOrbDeg = Math.max(existing.maxOrbDeg, orb);
          }
        } else {
          result.push({
            planets: [a.planet as PlanetName, b.planet as PlanetName],
            sign: a.sign,
            maxOrbDeg: parseFloat(orb.toFixed(2)),
          });
        }
      }
    }
  }
  return result;
}

function computeAspects(planets: PlanetPosition[]): PlanetaryAspect[] {
  const result: PlanetaryAspect[] = [];
  for (const src of planets) {
    const srcSign = src.signIndex;
    // Universal 7th aspect
    const seventh = (srcSign + 6) % 12;
    for (const tgt of planets) {
      if (tgt.planet === src.planet) continue;
      if (tgt.signIndex === seventh) {
        result.push({
          fromPlanet: src.planet as PlanetName,
          toPlanet: tgt.planet as PlanetName,
          aspectType: '7th',
        });
      }
    }
    // Special aspects
    const specials = SPECIAL_ASPECTS[src.planet as PlanetName];
    if (specials) {
      for (const offset of specials) {
        const targetSign = (srcSign + offset) % 12;
        for (const tgt of planets) {
          if (tgt.planet === src.planet) continue;
          if (tgt.signIndex === targetSign) {
            const houseNum = offset + 1;
            result.push({
              fromPlanet: src.planet as PlanetName,
              toPlanet: tgt.planet as PlanetName,
              aspectType: `${houseNum}th`,
            });
          }
        }
      }
    }
  }
  return result;
}

function computeCombustions(planets: PlanetPosition[]): CombustPlanet[] {
  const sun = planets.find(p => p.planet === 'Sun');
  if (!sun) return [];
  const result: CombustPlanet[] = [];
  for (const p of planets) {
    if (p.planet === 'Sun' || p.planet === 'Rahu' || p.planet === 'Ketu' || p.planet === 'Moon') continue;
    const orb = COMBUST_ORBS[p.planet as PlanetName];
    if (orb === undefined) continue;
    const diff = angularDiff(sun.longitude, p.longitude);
    if (diff <= orb) {
      result.push({
        planet: p.planet as PlanetName,
        sign: p.sign,
        orbFromSun: parseFloat(diff.toFixed(2)),
      });
    }
  }
  return result;
}

function buildSnapshot(dateStr: string, planets: PlanetPosition[]): WorldEventsSnapshot {
  return {
    date: dateStr,
    planets: planets.map(p => ({
      planet: p.planet as PlanetName,
      sign: p.sign,
      degree: parseFloat(p.degreeInSign.toFixed(2)),
      isRetrograde: p.isRetrograde,
      dignity: p.dignity.join(','),
    })),
    conjunctions: computeConjunctions(planets),
    aspects: computeAspects(planets),
    combustions: computeCombustions(planets),
  };
}

function sampleDates(from: string, to: string): string[] {
  const fromMs = new Date(`${from}T12:00:00Z`).getTime();
  const toMs   = new Date(`${to}T12:00:00Z`).getTime();
  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) throw new BadRequestException('Invalid date format; use YYYY-MM-DD');
  if (fromMs > toMs) throw new BadRequestException('"from" must be ≤ "to"');
  const daySpan = Math.ceil((toMs - fromMs) / 86_400_000) + 1;
  if (daySpan > 366 * 3) throw new BadRequestException('Date range must be at most ~3 years');
  if (daySpan === 1) return [from];
  const maxSamples = Math.min(24, daySpan);
  const dates: string[] = [];
  for (let i = 0; i < maxSamples; i++) {
    const t = fromMs + Math.floor((i / (maxSamples - 1)) * (toMs - fromMs));
    const d = new Date(t);
    dates.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`);
  }
  return [...new Set(dates)];
}

function computeMovements(from: string, to: string): {
  signIngresses: WorldEventsSignIngress[];
  retrogradeStations: WorldEventsRetroStation[];
} {
  const fromMs = new Date(`${from}T12:00:00Z`).getTime();
  const toMs   = new Date(`${to}T12:00:00Z`).getTime();
  const stationPlanets = new Set<string>(['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']);
  let prev: Record<string, { sign: string; rx: boolean } | undefined> = {};
  const signIngresses: WorldEventsSignIngress[] = [];
  const retrogradeStations: WorldEventsRetroStation[] = [];

  for (let t = fromMs; t <= toMs; t += 86_400_000) {
    const d    = new Date(t);
    const ds   = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    const pos  = calculateTransitPlanets(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    for (const p of pos) {
      const pr = prev[p.planet];
      if (pr) {
        if (pr.sign !== p.sign) signIngresses.push({ date: ds, planet: p.planet as PlanetName, fromSign: pr.sign, toSign: p.sign });
        if (stationPlanets.has(p.planet) && pr.rx !== p.isRetrograde) retrogradeStations.push({ date: ds, planet: p.planet as PlanetName, toRetrograde: p.isRetrograde });
      }
      prev[p.planet] = { sign: p.sign, rx: p.isRetrograde };
    }
  }
  return { signIngresses, retrogradeStations };
}

function formatSnapshotsForPrompt(snapshots: WorldEventsSnapshot[]): string {
  return snapshots.map(s => {
    const planetLine = s.planets.map(p => `${p.planet}${p.isRetrograde ? 'R' : ''} ${p.sign} ${p.degree.toFixed(1)}° [${p.dignity}]`).join(', ');
    const conjLine   = s.conjunctions.length ? `  Conjunctions: ${s.conjunctions.map(c => `${c.planets.join('+')} in ${c.sign}`).join('; ')}` : '';
    const aspectLine = s.aspects.length ? `  Aspects: ${s.aspects.map(a => `${a.fromPlanet} ${a.aspectType}→${a.toPlanet}`).join('; ')}` : '';
    const combustLine = s.combustions.length ? `  Combust: ${s.combustions.map(c => `${c.planet} (${c.orbFromSun.toFixed(1)}° from Sun)`).join(', ')}` : '';
    return [`[${s.date}] ${planetLine}`, conjLine, aspectLine, combustLine].filter(Boolean).join('\n');
  }).join('\n\n');
}

@Injectable()
export class WorldEventsService {
  private readonly logger = new Logger(WorldEventsService.name);

  async predict(from: string, to: string): Promise<WorldEventsResult> {
    if (!from?.trim() || !to?.trim()) throw new BadRequestException('Query params "from" and "to" (YYYY-MM-DD) are required');

    // Build snapshots with full mundane analysis
    const dates = sampleDates(from, to);
    const snapshots: WorldEventsSnapshot[] = [];
    for (const ds of dates) {
      const [y, m, d] = ds.split('-').map(x => parseInt(x, 10));
      const planets = calculateTransitPlanets(y, m, d);
      snapshots.push(buildSnapshot(ds, planets));
    }

    const { signIngresses, retrogradeStations } = computeMovements(from, to);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new BadRequestException('OPENAI_API_KEY is not configured');

    const model = 'gpt-5-mini';
    const openai = new OpenAI({ apiKey });

    const ingressLines = signIngresses.map(i => `${i.date}: ${i.planet} enters ${i.toSign} (from ${i.fromSign})`).join('\n');
    const retroLines   = retrogradeStations.map(r => `${r.date}: ${r.planet} goes ${r.toRetrograde ? 'retrograde' : 'direct'}`).join('\n');
    const snapshotText = formatSnapshotsForPrompt(snapshots);

    const prompt = `You are a Vedic mundane astrologer. Analyze the planetary data below and give your reading of global conditions for ${from} to ${to}.

Each planet carries its natural significations: Sun = leadership, authority; Moon = public mood, masses; Mars = conflict, military, fire; Mercury = trade, communications; Jupiter = law, finance, expansion; Venus = diplomacy, arts, agriculture; Saturn = hardship, discipline, mortality; Rahu = disruption, foreign affairs; Ketu = loss, spiritual upheaval.
State the analysis clearly, dont hide the negative and dont try to sugarcoat the truth. state it what it is positive or negative. in easy language.
Conjunctions, aspects, and combustions modify these significations. Dignified planets give stronger results in their domain; debilitated or combust planets give weakened or distorted results.
Planetary data (sidereal Lahiri):

${snapshotText}

Sign ingresses:
${ingressLines || 'None'}

Retrograde/direct stations:
${retroLines || 'None'}

Read the planets as they are. State what the configurations indicate for world conditions. Return valid JSON:
{
  "summary": "<3-4 paragraphs of overall analysis grounded in the planetary positions>",
  "majorThemes": ["<4-8 themes derived from the planetary data>"],
  "topicAnalysis": [
    { "topic": "Wars & Conflicts", "assessment": "<what the planets indicate>" },
    { "topic": "Economy & Inflation", "assessment": "<what the planets indicate>" },
    { "topic": "Global Markets", "assessment": "<what the planets indicate>" },
    { "topic": "Supply Chain & Trade", "assessment": "<what the planets indicate>" },
    { "topic": "Communications & Technology", "assessment": "<what the planets indicate>" },
    { "topic": "Political Leadership & Reforms", "assessment": "<what the planets indicate>" },
    { "topic": "Natural Disasters & Climate", "assessment": "<what the planets indicate>" },
    { "topic": "Public Health", "assessment": "<what the planets indicate>" }
  ],
  "monthlyHighlights": [
    { "periodLabel": "<month or sub-period>", "outlook": "<what the planets indicate>", "focusAreas": ["<domains>"] }
  ],
  "disclaimer": "Astrological analysis based on Vedic planetary transits."
}`;

    this.logger.log(`predict: model=${model} samples=${snapshots.length}`);
    const t0 = Date.now();
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_completion_tokens: 12000,
    });
    this.logger.log(`predict: done ${Date.now() - t0}ms`);

    const content = completion.choices[0]?.message?.content ?? '{}';
    try {
      const ai = JSON.parse(content) as Pick<WorldEventsResult, 'summary' | 'majorThemes' | 'topicAnalysis' | 'monthlyHighlights' | 'disclaimer'>;
      return { ...ai, snapshots, signIngresses, retrogradeStations, aiPrompt: prompt, model };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`predict: JSON parse failed ${msg}`);
      throw new BadRequestException('AI returned invalid JSON: ' + msg);
    }
  }
}
