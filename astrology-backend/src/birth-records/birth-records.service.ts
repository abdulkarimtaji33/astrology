import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import OpenAI from 'openai';
import { CreateBirthRecordDto } from './dto/create-birth-record.dto';
import { BirthRecord } from './birth-record.entity';
import { AiAnalysis } from './ai-analysis.entity';
import {
  calculateChart,
  calculateTransitPlanets,
  LagnaChart,
  PlanetName,
  PlanetPosition,
  SIGNS,
} from '../astrology/vedic-calc';
import { calculateNumerology, NumerologyResult } from '../astrology/numerology';

// ─── Enriched response types ─────────────────────────────────────────────────
export interface HousePlanetDetail {
  planet: string;
  degreeInSign: number;
  isRetrograde: boolean;
  dignity: string[];
  relationship: 'own' | 'friendly' | 'enemy' | 'neutral';
}

export interface HouseDetail {
  house: number;
  sign: string;
  signLord: string;
  mainTheme: string;
  represents: string;
  planets: HousePlanetDetail[];
}

export interface EnrichedChart extends LagnaChart {
  houseDetails: HouseDetail[];
}

export interface TransitDayData {
  date: string;
  planets: PlanetPosition[];
  houses: { house: number; sign: string; signIndex: number; planets: string[] }[];
}

export interface TransitResponse {
  natalLagna: LagnaChart['lagna'];
  natalPlanets: PlanetPosition[];
  from: string;
  to: string;
  days: TransitDayData[];
}

// ─── AI Analysis result types ────────────────────────────────────────────────
export interface GemstoneAdvice {
  name: string;
  planet: string;
  reason: string;
}

export interface TransitMetric {
  percentage: number;
  explanation: string;
}

export interface InvestmentMetric {
  level: string;
  percentage: number;
  explanation: string;
}

export interface AiAnalysisResult {
  lifeGeneral: string;
  personality: string;
  wealth: string;
  familyLife: string;
  marriageLife: string;
  strongAreas: string[];
  weakAreas: string[];
  recommendedGemstones: GemstoneAdvice[];
  gemstonesToAvoid: GemstoneAdvice[];
  transitPeriod: string;
  transitOverview: string;
  investmentRisk: InvestmentMetric;
  jobOpportunity: TransitMetric;
  marriageLikelihood: TransitMetric;
  goodHealthLikelihood: TransitMetric;
}

// ─── reference data shape ─────────────────────────────────────────────────────
type RefData = {
  signMap: Map<string, { ruledBy: number; lord: string }>;
  houseMap: Map<number, { mainTheme: string; represents: string }>;
  relMap: Map<string, number>;
};

const PLANET_DB_ID: Record<PlanetName, number> = {
  Sun: 1, Moon: 2, Mars: 3, Mercury: 4, Jupiter: 5, Venus: 6, Saturn: 7, Rahu: 8, Ketu: 9,
};

@Injectable()
export class BirthRecordsService implements OnModuleInit {
  constructor(
    @InjectRepository(BirthRecord)
    private readonly repo: Repository<BirthRecord>,
    @InjectRepository(AiAnalysis)
    private readonly aiRepo: Repository<AiAnalysis>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ai_analyses (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        birth_record_id INT NOT NULL,
        transit_from VARCHAR(10) NOT NULL,
        transit_to   VARCHAR(10) NOT NULL,
        basis        VARCHAR(10) NOT NULL,
        model        VARCHAR(50) NOT NULL,
        prompt       LONGTEXT NOT NULL,
        response     LONGTEXT NOT NULL,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ai_birth_record (birth_record_id)
      )
    `);
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  async create(dto: CreateBirthRecordDto): Promise<BirthRecord> {
    const record = this.repo.create({
      name: dto.name,
      birthDate: new Date(dto.birthDate),
      birthTime: dto.birthTime.length === 5 ? `${dto.birthTime}:00` : dto.birthTime,
      cityName: dto.cityName,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezone,
    });
    return this.repo.save(record);
  }

  // ── private helpers ───────────────────────────────────────────────────────
  private async loadRecord(id: number): Promise<BirthRecord> {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Birth record ${id} not found`);
    return record;
  }

  private parseBirthDate(record: BirthRecord): [number, number, number] {
    const dateStr =
      record.birthDate instanceof Date
        ? record.birthDate.toISOString().slice(0, 10)
        : String(record.birthDate).slice(0, 10);
    const [year, month, day] = dateStr.split('-').map(Number);
    return [year, month, day];
  }

  private parseBirthTime(record: BirthRecord): [number, number, number] {
    const [hour, minute, second = 0] = record.birthTime.split(':').map(Number);
    return [hour, minute, second];
  }

  private async loadRefData(): Promise<RefData> {
    const [houseRows, signRows, relRows] = await Promise.all([
      this.dataSource.query<{ id: number; main_theme: string; represents: string }[]>(
        'SELECT id, main_theme, represents FROM houses',
      ),
      this.dataSource.query<{ name: string; ruled_by: number; lord_name: string }[]>(
        `SELECT z.name, z.ruled_by, p.name AS lord_name
         FROM zodiac_signs z JOIN planets p ON z.ruled_by = p.id`,
      ),
      this.dataSource.query<{ planet_id: number; related_planet_id: number; is_friendly: number }[]>(
        'SELECT planet_id, related_planet_id, is_friendly FROM planet_relationships',
      ),
    ]);

    return {
      signMap: new Map(signRows.map(r => [r.name, { ruledBy: r.ruled_by, lord: r.lord_name }])),
      houseMap: new Map(houseRows.map(r => [r.id, { mainTheme: r.main_theme, represents: r.represents }])),
      relMap:   new Map(relRows.map(r => [`${r.planet_id}-${r.related_planet_id}`, r.is_friendly])),
    };
  }

  private buildHouseDetails(chart: LagnaChart, ref: RefData): HouseDetail[] {
    return chart.houses.map(h => {
      const sign      = ref.signMap.get(h.sign);
      const houseMeta = ref.houseMap.get(h.house);
      const lordDbId  = sign?.ruledBy ?? 0;

      const planets: HousePlanetDetail[] = chart.planets
        .filter(p => p.house === h.house)
        .map(p => {
          const pDbId = PLANET_DB_ID[p.planet as PlanetName];
          let relationship: HousePlanetDetail['relationship'] = 'neutral';
          if (pDbId === lordDbId) {
            relationship = 'own';
          } else if (pDbId && lordDbId) {
            const friendly = ref.relMap.get(`${pDbId}-${lordDbId}`);
            if (friendly === 1) relationship = 'friendly';
            else if (friendly === 2) relationship = 'enemy';
          }
          return {
            planet: p.planet,
            degreeInSign: p.degreeInSign,
            isRetrograde: p.isRetrograde,
            dignity: p.dignity,
            relationship,
          };
        });

      return {
        house:      h.house,
        sign:       h.sign,
        signLord:   sign?.lord ?? '',
        mainTheme:  houseMeta?.mainTheme ?? '',
        represents: houseMeta?.represents ?? '',
        planets,
      };
    });
  }

  // ── public chart methods ──────────────────────────────────────────────────
  async getChart(id: number): Promise<EnrichedChart> {
    const record = await this.loadRecord(id);
    const [year, month, day] = this.parseBirthDate(record);
    const [hour, minute, second] = this.parseBirthTime(record);
    const lat = record.latitude  ? Number(record.latitude)  : 20.5937;
    const lon = record.longitude ? Number(record.longitude) : 78.9629;

    const chart   = calculateChart(year, month, day, hour, minute, second, lat, lon, record.timezone ?? '');
    const ref     = await this.loadRefData();
    const houseDetails = this.buildHouseDetails(chart, ref);

    return { ...chart, houseDetails };
  }

  async getMoonChart(id: number): Promise<EnrichedChart> {
    const record = await this.loadRecord(id);
    const [year, month, day] = this.parseBirthDate(record);
    const [hour, minute, second] = this.parseBirthTime(record);
    const lat = record.latitude  ? Number(record.latitude)  : 20.5937;
    const lon = record.longitude ? Number(record.longitude) : 78.9629;

    const natal = calculateChart(year, month, day, hour, minute, second, lat, lon, record.timezone ?? '');

    // Moon's sign becomes Chandra Lagna (H1)
    const moon          = natal.planets.find(p => p.planet === 'Moon')!;
    const moonSignIndex = moon.signIndex;

    const remappedPlanets = natal.planets.map(p => ({
      ...p,
      house: ((p.signIndex - moonSignIndex + 12) % 12) + 1,
    }));

    const houses = Array.from({ length: 12 }, (_, i) => {
      const houseSignIndex = (moonSignIndex + i) % 12;
      return {
        house:      i + 1,
        sign:       SIGNS[houseSignIndex],
        signIndex:  houseSignIndex,
        planets:    remappedPlanets.filter(p => p.house === i + 1).map(p => p.planet),
      };
    });

    const moonChart: LagnaChart = {
      lagna: {
        longitude:    moon.longitude,
        sign:         moon.sign,
        signIndex:    moonSignIndex,
        degreeInSign: moon.degreeInSign,
      },
      planets:        remappedPlanets,
      houses,
      ayanamsa:       natal.ayanamsa,
      julianDay:      natal.julianDay,
      utcOffsetHours: natal.utcOffsetHours,
    };

    const ref          = await this.loadRefData();
    const houseDetails = this.buildHouseDetails(moonChart, ref);

    return { ...moonChart, houseDetails };
  }

  async getTransits(id: number, from: string, to: string, basis: 'lagna' | 'moon' = 'lagna'): Promise<TransitResponse> {
    if (!from || !to) throw new BadRequestException('Query params "from" and "to" (YYYY-MM-DD) are required');

    const record = await this.loadRecord(id);
    const [year, month, day] = this.parseBirthDate(record);
    const [hour, minute, second] = this.parseBirthTime(record);
    const lat = record.latitude  ? Number(record.latitude)  : 20.5937;
    const lon = record.longitude ? Number(record.longitude) : 78.9629;

    const natal = calculateChart(year, month, day, hour, minute, second, lat, lon, record.timezone ?? '');

    // Determine reference sign index based on basis
    const moon           = natal.planets.find(p => p.planet === 'Moon')!;
    const lagnaSignIndex = basis === 'moon' ? moon.signIndex : natal.lagna.signIndex;
    const basisLagna     = basis === 'moon'
      ? { longitude: moon.longitude, sign: moon.sign, signIndex: moon.signIndex, degreeInSign: moon.degreeInSign }
      : natal.lagna;

    const fromMs  = new Date(from + 'T00:00:00Z').getTime();
    const toMs    = new Date(to   + 'T00:00:00Z').getTime();
    if (isNaN(fromMs) || isNaN(toMs)) throw new BadRequestException('Invalid date format');
    if (fromMs > toMs) throw new BadRequestException('"from" must be ≤ "to"');

    const diffDays = Math.ceil((toMs - fromMs) / 86400000) + 1;

    const days: TransitDayData[] = [];
    for (let i = 0; i < diffDays; i++) {
      const d  = new Date(fromMs + i * 86400000);
      const yr = d.getUTCFullYear();
      const mo = d.getUTCMonth() + 1;
      const dy = d.getUTCDate();

      const transitPlanets = calculateTransitPlanets(yr, mo, dy, lagnaSignIndex);

      const houses = Array.from({ length: 12 }, (_, j) => {
        const houseSignIndex = (lagnaSignIndex + j) % 12;
        return {
          house:     j + 1,
          sign:      SIGNS[houseSignIndex],
          signIndex: houseSignIndex,
          planets:   transitPlanets.filter(p => p.house === j + 1).map(p => p.planet),
        };
      });

      days.push({
        date:    `${yr}-${String(mo).padStart(2, '0')}-${String(dy).padStart(2, '0')}`,
        planets: transitPlanets,
        houses,
      });
    }

    return {
      natalLagna:   basisLagna,
      natalPlanets: natal.planets,
      from,
      to:  days[days.length - 1]?.date ?? to,
      days,
    };
  }

  async getNumerology(id: number, targetYear?: number): Promise<NumerologyResult> {
    const record = await this.loadRecord(id);
    const [year, month, day] = this.parseBirthDate(record);
    return calculateNumerology(day, month, year, targetYear, record.name ?? '');
  }

  // ── AI analysis ──────────────────────────────────────────────────────────

  private fmtPlanets(planets: PlanetPosition[]): string {
    return planets.map(p => {
      const retro = p.isRetrograde ? ' (retrograde)' : '';
      const dignity = p.dignity.length ? p.dignity.join(', ') : 'neutral';
      return `  ${p.planet}${retro}: ${p.sign} ${p.degreeInSign.toFixed(1)}° | H${p.house} | ${dignity}`;
    }).join('\n');
  }

  private fmtHouses(houseDetails: HouseDetail[]): string {
    return houseDetails.map(h => {
      const planetStr = h.planets.length
        ? h.planets.map(p => `${p.planet}(${p.relationship}${p.isRetrograde ? ',retrograde' : ''})`).join(', ')
        : 'empty';
      return `  H${h.house} (${h.sign}, Lord: ${h.signLord}): ${h.mainTheme} | ${h.represents}\n    Planets: ${planetStr}`;
    }).join('\n');
  }

  private fmtSignChanges(days: TransitDayData[]): string {
    const planets = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Rahu','Ketu'];
    const changes: string[] = [];
    for (const planet of planets) {
      let prevSign: string | null = null;
      for (const day of days) {
        const pos = day.planets.find(p => p.planet === planet);
        if (!pos) continue;
        if (prevSign !== null && pos.sign !== prevSign) {
          changes.push(`  ${planet}: ${prevSign} → ${pos.sign} on ${day.date}`);
        }
        prevSign = pos.sign;
      }
    }
    return changes.length ? changes.join('\n') : '  No sign changes in this period';
  }

  private fmtPlanetRelationships(
    relMap: Map<string, number>,
  ): string {
    const planets: PlanetName[] = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
    const header = '         ' + planets.map(p => p.padEnd(9)).join('');
    const rows = planets.map(p => {
      const cells = planets.map(q => {
        if (p === q) return 'self     ';
        const key = `${PLANET_DB_ID[p]}-${PLANET_DB_ID[q]}`;
        const v = relMap.get(key);
        const label = v === 1 ? 'friend' : v === 2 ? 'enemy' : 'neutral';
        return label.padEnd(9);
      });
      return p.padEnd(9) + cells.join('');
    });
    return [header, ...rows].join('\n');
  }

  private buildPrompt(
    record: BirthRecord,
    lagna: EnrichedChart,
    moon: EnrichedChart,
    transit: TransitResponse,
    numerology: NumerologyResult,
    from: string,
    to: string,
    basis: 'lagna' | 'moon',
    relMap?: Map<string, number>,
  ): string {
    const dateStr = record.birthDate instanceof Date
      ? record.birthDate.toISOString().slice(0, 10)
      : String(record.birthDate).slice(0, 10);

    const missingNums = [1,2,3,4,5,6,7,8,9]
      .filter(n => numerology.digitCount[n] === 0)
      .join(', ') || 'none';

    const planes = [
      { name: 'Thought (4,9,2)', nums: [4,9,2] },
      { name: 'Will (3,5,7)',    nums: [3,5,7] },
      { name: 'Action (8,1,6)', nums: [8,1,6] },
      { name: 'Mind (4,3,8)',   nums: [4,3,8] },
      { name: 'Soul (9,5,1)',   nums: [9,5,1] },
      { name: 'Physical (2,7,6)', nums: [2,7,6] },
    ].map(p => {
      const count = p.nums.filter(n => numerology.digitCount[n] > 0).length;
      return `  ${p.name}: ${count}/3`;
    }).join('\n');

    const firstDay = transit.days[0];
    const lastDay  = transit.days[transit.days.length - 1];

    return `You are an expert Vedic astrologer (Jyotish) providing a factual chart reading.

TONE RULES — follow these strictly:
- Be neutral, direct, and factual. State what the chart shows, nothing more.
- Do NOT use motivational, encouraging, or consoling language. Do not say things like "you have great potential", "opportunities await", "with effort you can overcome", or any similar phrases.
- Do NOT soften difficult placements. If a planet is debilitated, retrograde, combust, or in an enemy sign — state it plainly and describe the realistic effect.
- Do NOT inflate the positive. If a placement is genuinely strong, say so. If it is mixed or weak, say so.
- Percentages must reflect the actual chart and transit quality. A difficult transit for investment should score low (10–30%). Do not default to moderate numbers to avoid seeming negative.
- Mention specific planets, houses, signs, and dignities as evidence for every claim.

BIRTH DETAILS:
Name: ${record.name}
Birth Date: ${dateStr}
Birth Time: ${record.birthTime}
Location: ${record.cityName ?? 'Unknown'} (Lat: ${record.latitude ?? 'N/A'}, Lon: ${record.longitude ?? 'N/A'})
Timezone: ${record.timezone ?? 'Unknown'}

=== LAGNA CHART (D1 – Natal Chart) ===
Ascendant: ${lagna.lagna.sign} ${lagna.lagna.degreeInSign.toFixed(2)}°
Ayanamsa (Lahiri): ${lagna.ayanamsa.toFixed(4)}°

Planetary Positions:
${this.fmtPlanets(lagna.planets)}

House Analysis:
${this.fmtHouses(lagna.houseDetails)}

=== MOON CHART (Chandra Lagna) ===
Moon Sign (Ascendant): ${moon.lagna.sign} ${moon.lagna.degreeInSign.toFixed(2)}°

Planetary Positions (from Moon):
${this.fmtPlanets(moon.planets)}

House Analysis (from Moon):
${this.fmtHouses(moon.houseDetails)}

=== NUMEROLOGY ===
Driver Number: ${numerology.driverNumber} – ${numerology.driverMeaning.title} (${numerology.driverMeaning.keywords})
Conductor Number: ${numerology.conductorNumber} – ${numerology.conductorMeaning.title} (${numerology.conductorMeaning.keywords})
Name Number (Chaldean): ${numerology.nameNumber} – ${numerology.nameNumberMeaning.title} (${numerology.nameNumberMeaning.keywords}) [Name: "${numerology.name}", Total: ${numerology.nameCompound}]
Personal Year ${numerology.targetYear}: ${numerology.personalYear} – ${numerology.personalYearMeaning.title} (${numerology.personalYearMeaning.keywords})
Missing Numbers from Lo Shu Grid: ${missingNums}
Planes of Expression:
${planes}

=== TRANSIT ANALYSIS: ${from} to ${to} ===
House Count Basis: ${basis === 'moon' ? 'Moon Sign' : 'Natal Lagna'} (${transit.natalLagna.sign})

Transit Positions at Start (${from}):
${firstDay ? this.fmtPlanets(firstDay.planets) : 'N/A'}

Transit Positions at End (${to}):
${lastDay ? this.fmtPlanets(lastDay.planets) : 'N/A'}

Sign Changes During This Period:
${this.fmtSignChanges(transit.days)}

=== PLANET RELATIONSHIPS (Vedic Naisargika Maitri) ===
${relMap ? this.fmtPlanetRelationships(relMap) : '(not available)'}

GEMSTONE RULE:
- recommendedGemstones MUST contain AT LEAST 3 entries (friendly/own planets that benefit this chart).
- gemstonesToAvoid MUST contain AT LEAST 3 entries (enemy planets whose gemstones would harm this chart).
- NEVER put an enemy planet's gemstone in recommendedGemstones.
- Each entry must have a distinct planet and gemstone.

=== OUTPUT INSTRUCTIONS ===
Analyze ALL data above. Cite specific planets, houses, and dignities for every statement. Do not skip difficult placements — debilitations, retrogrades, combustions, malefics in sensitive houses, and afflicted house lords must all be addressed explicitly.

Return ONLY a valid JSON object (no markdown fences, no text outside JSON):

{
  "lifeGeneral": "<2-3 paragraphs: life path, core karma, key patterns. Name the specific ascendant lord, its placement, and what that concretely means. Address both strengths and problems in the chart without weighting either side.>",
  "personality": "<1-2 paragraphs: temperament and behavior patterns from Lagna and Moon sign. Include negative traits where the chart shows them — e.g. impulsiveness, rigidity, emotional difficulty, etc.>",
  "wealth": "<1-2 paragraphs: financial picture from 2nd and 11th houses, their lords, and any relevant yogas or afflictions. State clearly if the chart shows financial struggle, instability, or restriction, and why.>",
  "familyLife": "<1-2 paragraphs: family relationships from 4th house. Include any karmic difficulties — estrangement, loss, tension — if shown by the chart.>",
  "marriageLife": "<1-2 paragraphs: marriage prospects from 7th house lord, Venus, and relevant transits. State delays, complications, or incompatibility indicators if present.>",
  "strongAreas": ["<specific area supported by the chart>", ...],
  "weakAreas": ["<specific area with chart evidence>", ...],
  "recommendedGemstones": [
    {"name": "<gemstone 1>", "planet": "<planet 1>", "reason": "<why>"},
    {"name": "<gemstone 2>", "planet": "<planet 2>", "reason": "<why>"},
    {"name": "<gemstone 3>", "planet": "<planet 3>", "reason": "<why>"}
  ],
  "gemstonesToAvoid": [
    {"name": "<gemstone 1>", "planet": "<planet 1>", "reason": "<why>"},
    {"name": "<gemstone 2>", "planet": "<planet 2>", "reason": "<why>"},
    {"name": "<gemstone 3>", "planet": "<planet 3>", "reason": "<why>"}
  ],
  "transitPeriod": "${from} to ${to}",
  "transitOverview": "<2-3 paragraphs: factual account of major transit movements and their effects. State which houses are activated, which are stressed, and what the realistic tone of the period is — including if it is a difficult or restricted period.>",
  "investmentRisk": {
    "level": "<very risky | risky | neutral | good | excellent>",
    "percentage": <integer 0–100 reflecting actual transit quality for investments — score low if 2nd/11th lords are afflicted or Saturn/Rahu are active there>,
    "explanation": "<state which planets and houses drive this assessment>"
  },
  "jobOpportunity": {
    "percentage": <integer 0–100>,
    "explanation": "<10th house transits, Jupiter/Saturn/Sun positions and what they indicate>"
  },
  "marriageLikelihood": {
    "percentage": <integer 0–100>,
    "explanation": "<7th house transits, Venus and Jupiter positions>"
  },
  "goodHealthLikelihood": {
    "percentage": <integer 0–100>,
    "explanation": "<1st, 6th, 8th house transits, Sun/Moon/Mars positions>"
  }
}`;
  }

  async getAiAnalysis(
    id: number,
    from: string,
    to: string,
    basis: 'lagna' | 'moon' = 'lagna',
    targetYear?: number,
  ): Promise<AiAnalysisResult> {
    if (!from || !to) throw new BadRequestException('Query params "from" and "to" are required');

    const [lagnaChart, moonChart, transitData, numerology, record, ref] = await Promise.all([
      this.getChart(id),
      this.getMoonChart(id),
      this.getTransits(id, from, to, basis),
      this.getNumerology(id, targetYear),
      this.loadRecord(id),
      this.loadRefData(),
    ]);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new BadRequestException('OPENAI_API_KEY is not configured');

    const model  = 'gpt-4o';
    const openai = new OpenAI({ apiKey });
    const prompt = this.buildPrompt(record, lagnaChart, moonChart, transitData, numerology, from, to, basis, ref.relMap);

    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4096,
    });

    const content = completion.choices[0]?.message?.content ?? '{}';

    await this.aiRepo.save(
      this.aiRepo.create({
        birthRecordId: id,
        transitFrom:   from,
        transitTo:     to,
        basis,
        model,
        prompt,
        response: content,
      }),
    );

    return JSON.parse(content) as AiAnalysisResult;
  }

  async getPlanetRelationships(): Promise<{
    planets: string[];
    relationships: Record<string, Record<string, 'friendly' | 'enemy' | 'neutral'>>;
  }> {
    const rows = await this.dataSource.query<
      { planet: string; related: string; is_friendly: number }[]
    >(
      `SELECT p1.name AS planet, p2.name AS related, pr.is_friendly
       FROM planet_relationships pr
       JOIN planets p1 ON p1.id = pr.planet_id
       JOIN planets p2 ON p2.id = pr.related_planet_id
       ORDER BY p1.id, p2.id`,
    );

    const planetSet = new Set<string>();
    rows.forEach(r => { planetSet.add(r.planet); planetSet.add(r.related); });
    const planets = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
      .filter(p => planetSet.has(p));

    const relationships: Record<string, Record<string, 'friendly' | 'enemy' | 'neutral'>> = {};
    for (const p of planets) {
      relationships[p] = {};
      for (const q of planets) {
        if (p === q) { relationships[p][q] = 'neutral'; continue; }
        const row = rows.find(r => r.planet === p && r.related === q);
        if (!row) { relationships[p][q] = 'neutral'; continue; }
        relationships[p][q] = row.is_friendly === 1 ? 'friendly' : row.is_friendly === 2 ? 'enemy' : 'neutral';
      }
    }

    return { planets, relationships };
  }

  async listAiAnalyses(birthRecordId: number): Promise<AiAnalysis[]> {
    return this.aiRepo.find({
      where: { birthRecordId },
      order: { createdAt: 'DESC' },
      select: ['id', 'birthRecordId', 'transitFrom', 'transitTo', 'basis', 'model', 'createdAt'],
    });
  }

  async getAiAnalysisById(birthRecordId: number, analysisId: number): Promise<AiAnalysisResult> {
    const row = await this.aiRepo.findOne({ where: { id: analysisId, birthRecordId } });
    if (!row) throw new NotFoundException(`Analysis ${analysisId} not found`);
    return JSON.parse(row.response) as AiAnalysisResult;
  }
}
