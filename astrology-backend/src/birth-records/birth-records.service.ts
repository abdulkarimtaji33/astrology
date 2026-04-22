import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { DataSource, Repository } from 'typeorm';
import OpenAI from 'openai';
import { CreateBirthRecordDto } from './dto/create-birth-record.dto';
import { BirthRecord } from './birth-record.entity';
import { AiAnalysis } from './ai-analysis.entity';
import {
  calculateChart,
  calculateTransitPlanets,
  calculateMahadasha,
  calculateSaturnTransits,
  MahadashaResult,
  SaturnTransitResult,
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

export interface TransitHouseInfo {
  house: number;
  sign: string;
  signLord: string;
  mainTheme: string;
  represents: string;
  /** relationship of each transit planet to the sign lord of this house */
  planetRelationships: Record<string, 'own' | 'friendly' | 'enemy' | 'neutral'>;
}

export interface TransitResponse {
  natalLagna: LagnaChart['lagna'];
  natalPlanets: PlanetPosition[];
  houseInfo: TransitHouseInfo[];
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

export interface ThemeAnalysis {
  lifeAnalysis: string;
  transitAnalysis: string;
}

export interface AiAnalysisResult {
  lifeGeneral: ThemeAnalysis;
  personality: ThemeAnalysis;
  wealth: ThemeAnalysis;
  familyLife: ThemeAnalysis;
  marriageLife: ThemeAnalysis;
  strongAreas: string[];
  weakAreas: string[];
  recommendedGemstones: GemstoneAdvice[];
  gemstonesToAvoid: GemstoneAdvice[];
  transitPeriod: string;
  transitOverview: string;
  dashaAnalysis: string;
}

export interface HouseAiResult {
  interpretation: string;
  keyThemes: string[];
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
  private readonly logger = new Logger(BirthRecordsService.name);
  /** Cached text from ai-data/data.txt — used only for birth-chart AI, not world events. */
  private aiKnowledgePromise: Promise<string> | null = null;

  constructor(
    @InjectRepository(BirthRecord)
    private readonly repo: Repository<BirthRecord>,
    @InjectRepository(AiAnalysis)
    private readonly aiRepo: Repository<AiAnalysis>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    this.logger.log('onModuleInit: ensuring ai_analyses table');
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
    this.logger.log('onModuleInit: done');
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  async create(dto: CreateBirthRecordDto): Promise<BirthRecord> {
    this.logger.log(`create: name=${dto.name} birthDate=${dto.birthDate}`);
    const record = this.repo.create({
      name: dto.name,
      birthDate: new Date(dto.birthDate),
      birthTime: dto.birthTime.length === 5 ? `${dto.birthTime}:00` : dto.birthTime,
      cityName: dto.cityName,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezone,
    });
    const saved = await this.repo.save(record);
    this.logger.log(`create: saved id=${saved.id}`);
    return saved;
  }

  async getSummary(id: number): Promise<{
    id: number;
    name: string;
    birthDate: string;
    birthTime: string;
    cityName: string | null;
    timezone: string | null;
  }> {
    this.logger.log(`getSummary: id=${id}`);
    const r = await this.loadRecord(id);
    const birthDate =
      r.birthDate instanceof Date
        ? r.birthDate.toISOString().slice(0, 10)
        : String(r.birthDate).slice(0, 10);
    const birthTime = String(r.birthTime).slice(0, 8);
    return {
      id: r.id,
      name: r.name,
      birthDate,
      birthTime,
      cityName: r.cityName ?? null,
      timezone: r.timezone ?? null,
    };
  }

  // ── private helpers ───────────────────────────────────────────────────────
  private async loadRecord(id: number): Promise<BirthRecord> {
    this.logger.debug(`loadRecord: id=${id}`);
    const record = await this.repo.findOne({ where: { id } });
    if (!record) {
      this.logger.warn(`loadRecord: not found id=${id}`);
      throw new NotFoundException(`Birth record ${id} not found`);
    }
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
    this.logger.debug('loadRefData: querying houses, zodiac_signs, planet_relationships');
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

    const ref = {
      signMap: new Map(signRows.map(r => [r.name, { ruledBy: r.ruled_by, lord: r.lord_name }])),
      houseMap: new Map(houseRows.map(r => [r.id, { mainTheme: r.main_theme, represents: r.represents }])),
      relMap:   new Map(relRows.map(r => [`${r.planet_id}-${r.related_planet_id}`, r.is_friendly])),
    };
    this.logger.debug(
      `loadRefData: houses=${houseRows.length} signs=${signRows.length} rels=${relRows.length}`,
    );
    return ref;
  }

  private getAiKnowledgeText(): Promise<string> {
    if (!this.aiKnowledgePromise) {
      const path = join(process.cwd(), 'ai-data', 'data.txt');
      this.aiKnowledgePromise = readFile(path, 'utf8')
        .then(text => {
          const s = text.trim();
          this.logger.log(`getAiKnowledgeText: loaded ${s.length} chars from ${path}`);
          return s;
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`getAiKnowledgeText: could not read ${path}: ${msg}`);
          return '';
        });
    }
    return this.aiKnowledgePromise;
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
    this.logger.log(`getChart: start id=${id}`);
    const record = await this.loadRecord(id);
    const [year, month, day] = this.parseBirthDate(record);
    const [hour, minute, second] = this.parseBirthTime(record);
    const lat = record.latitude  ? Number(record.latitude)  : 20.5937;
    const lon = record.longitude ? Number(record.longitude) : 78.9629;

    const chart   = calculateChart(year, month, day, hour, minute, second, lat, lon, record.timezone ?? '');
    const ref     = await this.loadRefData();
    const houseDetails = this.buildHouseDetails(chart, ref);

    this.logger.log(`getChart: done id=${id} lagna=${chart.lagna.sign}`);
    return { ...chart, houseDetails };
  }

  async getMoonChart(id: number): Promise<EnrichedChart> {
    this.logger.log(`getMoonChart: start id=${id}`);
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

    this.logger.log(`getMoonChart: done id=${id} moonLagna=${moonChart.lagna.sign}`);
    return { ...moonChart, houseDetails };
  }

  /** Transit houses are always whole-sign from the natal Moon sign (Chandra Lagna). */
  async getTransits(id: number, from: string, to: string, basis: 'lagna' | 'moon' = 'lagna'): Promise<TransitResponse> {
    this.logger.log(`getTransits: start id=${id} from=${from} to=${to} basis=${basis}`);
    if (!from || !to) throw new BadRequestException('Query params "from" and "to" (YYYY-MM-DD) are required');

    const record = await this.loadRecord(id);
    const [year, month, day] = this.parseBirthDate(record);
    const [hour, minute, second] = this.parseBirthTime(record);
    const lat = record.latitude  ? Number(record.latitude)  : 20.5937;
    const lon = record.longitude ? Number(record.longitude) : 78.9629;

    const natal = calculateChart(year, month, day, hour, minute, second, lat, lon, record.timezone ?? '');

    const moon = natal.planets.find(p => p.planet === 'Moon')!;
    const lagnaSignIndex = basis === 'moon' ? moon.signIndex : natal.lagna.signIndex;
    const basisLagna = basis === 'moon'
      ? { longitude: moon.longitude, sign: moon.sign, signIndex: moon.signIndex, degreeInSign: moon.degreeInSign }
      : { longitude: natal.lagna.longitude, sign: natal.lagna.sign, signIndex: natal.lagna.signIndex, degreeInSign: natal.lagna.degreeInSign };

    const fromMs  = new Date(from + 'T00:00:00Z').getTime();
    const toMs    = new Date(to   + 'T00:00:00Z').getTime();
    if (isNaN(fromMs) || isNaN(toMs)) throw new BadRequestException('Invalid date format');
    if (fromMs > toMs) throw new BadRequestException('"from" must be ≤ "to"');

    const diffDays = Math.ceil((toMs - fromMs) / 86400000) + 1;
    this.logger.log(`getTransits: computing ${diffDays} days basis=${basis} sign=${basisLagna.sign}`);

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

    const ref = await this.loadRefData();
    const allPlanets: PlanetName[] = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
    const houseInfo: TransitHouseInfo[] = Array.from({ length: 12 }, (_, i) => {
      const houseSignIndex = (lagnaSignIndex + i) % 12;
      const sign = SIGNS[houseSignIndex];
      const signData = ref.signMap.get(sign);
      const houseMeta = ref.houseMap.get(i + 1);
      const lordDbId = signData?.ruledBy ?? 0;

      const planetRelationships: Record<string, 'own' | 'friendly' | 'enemy' | 'neutral'> = {};
      for (const planet of allPlanets) {
        const pDbId = PLANET_DB_ID[planet];
        if (pDbId === lordDbId) {
          planetRelationships[planet] = 'own';
        } else if (pDbId && lordDbId) {
          const v = ref.relMap.get(`${pDbId}-${lordDbId}`);
          planetRelationships[planet] = v === 1 ? 'friendly' : v === 2 ? 'enemy' : 'neutral';
        } else {
          planetRelationships[planet] = 'neutral';
        }
      }

      return {
        house:      i + 1,
        sign,
        signLord:   signData?.lord ?? '',
        mainTheme:  houseMeta?.mainTheme ?? '',
        represents: houseMeta?.represents ?? '',
        planetRelationships,
      };
    });

    this.logger.log(`getTransits: done id=${id} days=${days.length}`);
    return {
      natalLagna:   basisLagna,
      natalPlanets: natal.planets,
      houseInfo,
      from,
      to:  days[days.length - 1]?.date ?? to,
      days,
    };
  }

  async getNumerology(id: number, targetYear?: number): Promise<NumerologyResult> {
    this.logger.log(`getNumerology: id=${id} targetYear=${targetYear ?? 'default'}`);
    const record = await this.loadRecord(id);
    const [year, month, day] = this.parseBirthDate(record);
    const n = calculateNumerology(day, month, year, targetYear, record.name ?? '');
    this.logger.debug(`getNumerology: done driver=${n.driverNumber}`);
    return n;
  }

  async getMahadasha(id: number): Promise<MahadashaResult> {
    this.logger.log(`getMahadasha: id=${id}`);
    const record = await this.loadRecord(id);
    const [year, month, day] = this.parseBirthDate(record);
    const [hour, minute, second] = this.parseBirthTime(record);
    const lat = record.latitude  ? Number(record.latitude)  : 20.5937;
    const lon = record.longitude ? Number(record.longitude) : 78.9629;

    const chart = calculateChart(year, month, day, hour, minute, second, lat, lon, record.timezone ?? '');
    const moon  = chart.planets.find(p => p.planet === 'Moon')!;

    const birthDate = new Date(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T00:00:00Z`);
    const md = calculateMahadasha(moon.longitude, birthDate);
    this.logger.log(`getMahadasha: done periods=${md.periods.length}`);
    return md;
  }

  async getSaturnTransits(id: number): Promise<SaturnTransitResult> {
    this.logger.log(`getSaturnTransits: id=${id}`);
    const record = await this.loadRecord(id);
    const [year, month, day] = this.parseBirthDate(record);
    const [hour, minute, second] = this.parseBirthTime(record);
    const lat = record.latitude  ? Number(record.latitude)  : 20.5937;
    const lon = record.longitude ? Number(record.longitude) : 78.9629;

    const chart = calculateChart(year, month, day, hour, minute, second, lat, lon, record.timezone ?? '');
    const moon  = chart.planets.find(p => p.planet === 'Moon')!;
    const result = calculateSaturnTransits(moon.signIndex);
    this.logger.log(`getSaturnTransits: done periods=${result.periods.length}`);
    return result;
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
      let prevRetro: boolean | null = null;
      for (const day of days) {
        const pos = day.planets.find(p => p.planet === planet);
        if (!pos) continue;
        if (prevSign !== null && pos.sign !== prevSign) {
          const retroTag = pos.isRetrograde ? ' (retrograde)' : '';
          changes.push(`  ${planet}${retroTag}: ${prevSign} → ${pos.sign} on ${day.date}`);
        }
        if (prevRetro !== null && pos.isRetrograde !== prevRetro) {
          const label = pos.isRetrograde ? 'goes retrograde' : 'goes direct';
          changes.push(`  ${planet} ${label} on ${day.date} in ${pos.sign}`);
        }
        prevSign  = pos.sign;
        prevRetro = pos.isRetrograde;
      }
    }
    return changes.length ? changes.join('\n') : '  No sign changes or station changes in this period';
  }

  private fmtRetrogrades(days: TransitDayData[]): string {
    if (!days.length) return '  (no data)';
    const planets = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Rahu','Ketu'];
    const lines: string[] = [];
    // Find contiguous retrograde spans for each planet
    for (const planet of planets) {
      let spanStart: string | null = null;
      let spanSign: string | null  = null;
      for (const day of days) {
        const pos = day.planets.find(p => p.planet === planet);
        if (!pos) continue;
        if (pos.isRetrograde && spanStart === null) {
          spanStart = day.date;
          spanSign  = pos.sign;
        } else if (!pos.isRetrograde && spanStart !== null) {
          lines.push(`  ${planet} RETROGRADE: ${spanStart} → ${day.date} (in ${spanSign})`);
          spanStart = null;
          spanSign  = null;
        }
      }
      // Still retrograde at end of period
      if (spanStart !== null) {
        const lastDay = days[days.length - 1];
        lines.push(`  ${planet} RETROGRADE: ${spanStart} → ${lastDay.date}+ (in ${spanSign}, continues beyond period)`);
      }
    }
    return lines.length ? lines.join('\n') : '  No planets retrograde during this period';
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

  private fmtMahadasha(md: MahadashaResult): string {
    const current = md.periods.find(p => p.isCurrent);
    const lines = [`Moon Nakshatra: ${md.moonNakshatra} (index ${md.moonNakshatraIndex})`];
    lines.push(`Dasha Lord at Birth: ${md.dashaLordAtBirth}`);
    if (current) {
      lines.push(`Current Mahadasha: ${current.planet} (${current.startDate} → ${current.endDate})`);
      // Find upcoming period
      const idx = md.periods.indexOf(current);
      if (idx + 1 < md.periods.length) {
        const next = md.periods[idx + 1];
        lines.push(`Next Mahadasha: ${next.planet} (${next.startDate} → ${next.endDate})`);
      }
    }
    lines.push('\nAll Periods:');
    for (const p of md.periods) {
      const marker = p.isCurrent ? ' ← CURRENT' : '';
      lines.push(`  ${p.planet.padEnd(9)} ${p.startDate} → ${p.endDate}${marker}`);
    }
    return lines.join('\n');
  }

  private fmtSaturnTransits(st: SaturnTransitResult | undefined): string {
    if (!st) return '(not available)';
    const lines = [`Natal Moon Sign: ${st.natalMoonSign}`];
    if (!st.currentPeriod) {
      lines.push('Currently: NOT in Sade Sati or Dhaiyya');
    } else {
      const cp = st.currentPeriod;
      const type = cp.type === 'sade-sati'
        ? `Sade Sati (${cp.phase} phase)`
        : 'Dhaiyya';
      lines.push(`Currently IN: ${type} — Saturn in ${cp.saturnSign} (${cp.startDate} → ${cp.endDate})`);
    }
    const relevant = st.periods.filter(p => p.isActive || (!p.isPast && new Date(p.startDate) < new Date(Date.now() + 365*24*60*60*1000*5)));
    if (relevant.length) {
      lines.push('Nearby Periods:');
      for (const p of relevant) {
        const label = p.type === 'sade-sati' ? `Sade Sati (${p.phase})` : 'Dhaiyya';
        const status = p.isActive ? ' ← ACTIVE' : '';
        lines.push(`  ${label.padEnd(22)} Saturn in ${p.saturnSign.padEnd(12)} ${p.startDate} → ${p.endDate}${status}`);
      }
    }
    return lines.join('\n');
  }

  private buildPrompt(
    record: BirthRecord,
    lagna: EnrichedChart,
    moon: EnrichedChart,
    transit: TransitResponse,
    numerology: NumerologyResult,
    from: string,
    to: string,
    relMap: Map<string, number> | undefined,
    mahadasha: MahadashaResult | undefined,
    saturnTransits: SaturnTransitResult | undefined,
    knowledge: string,
    basis: 'lagna' | 'moon' = 'lagna',
  ): string {
    this.logger.debug(`buildPrompt: ${record.name} ${from}–${to}`);
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

    const knowledgeBlock =
      knowledge.length > 0
        ? `
=== VEDIC REFERENCE KNOWLEDGE (natal chart interpretation only — house/planet effects, remedies, classical points; align with this when it matches the chart; do not use for mundane/world astrology) ===
${knowledge}

`
        : '';

    return `You are an expert Vedic astrologer (Jyotish) providing a factual chart reading.

TONE RULES — follow these strictly:
- Be neutral, direct, and factual. State what the chart shows, nothing more.
- Do NOT use motivational, encouraging, or consoling language. Do not say things like "you have great potential", "opportunities await", "with effort you can overcome", or any similar phrases.
- Do NOT soften difficult placements. If a planet is debilitated, retrograde, combust, or in an enemy sign — state it plainly and describe the realistic effect.
- Do NOT inflate the positive. If a placement is genuinely strong, say so. If it is mixed or weak, say so.
- Dasha analysis is CRITICAL — the Mahadasha lord's natal strength, sign, house, and relationships to wealth/career houses must directly inform the dashaAnalysis field and thematic sections.
- Don't care about the "friend, enemy, neutral" that is given to you. it is just a relationship between two planets for gemstone recommendations.
- Check retrogrades properly, combustions, debilitations and all the rules properly

This knowledge will help you in your interpretations:
${knowledgeBlock} 

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

=== MOON CHART (Chandra Lagna) (moon chart is only for making transits, for life predictions, use lagna chart) ===
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
Transit Basis: ${basis === 'moon' ? `Chandra Lagna (Moon sign: ${transit.natalLagna.sign})` : `Lagna (Ascendant: ${lagna.lagna.sign})`}
Houses in this transit are counted from the ${basis === 'moon' ? 'Moon sign' : 'Ascendant (Lagna)'}.

Transit Positions at Start (${from}) — houses from ${basis === 'moon' ? `Moon (Chandra Lagna: ${transit.natalLagna.sign})` : `Lagna (${lagna.lagna.sign})`}:
${firstDay ? this.fmtPlanets(firstDay.planets) : 'N/A'}

Transit Positions at End (${to}) — houses from ${basis === 'moon' ? `Moon (Chandra Lagna: ${transit.natalLagna.sign})` : `Lagna (${lagna.lagna.sign})`}:
${lastDay ? this.fmtPlanets(lastDay.planets) : 'N/A'}

Retrograde Periods During This Transit:
${this.fmtRetrogrades(transit.days)}

Sign Changes & Station Changes During This Period:
${this.fmtSignChanges(transit.days)}

=== VIMSHOTTARI MAHADASHA ===
${mahadasha ? this.fmtMahadasha(mahadasha) : '(not available)'}

=== SATURN SADE SATI / DHAIYYA ===
${this.fmtSaturnTransits(saturnTransits)}

=== PLANET RELATIONSHIPS (Vedic Naisargika Maitri) ===
${relMap ? this.fmtPlanetRelationships(relMap) : '(not available)'}

GEMSTONE RULE:
- Gemstone recommendations are based on the LAGNA LORD's perspective (the lord of H1 in the Lagna chart).
- recommendedGemstones: planets that are friendly or own TO THE LAGNA LORD (per the relationship table above). These are safe to strengthen.
- gemstonesToAvoid: planets that are ENEMY to the Lagna lord. Wearing their gemstone harms the chart.
- Example: if Lagna is Scorpio, the Lagna lord is Mars. Look at Mars's row in the relationship table. Planets Mars considers friend → recommended. Planets Mars considers enemy → avoid.
- recommendedGemstones MUST contain AT LEAST 3 entries.
- gemstonesToAvoid MUST contain AT LEAST 3 entries.
- Each entry must have a distinct planet and gemstone.
- Gemstones should be recommended by birth chart, not mahadasha or transit.
- If a gemstone resolves the weakness of a planet, it should be prioritized over others. But it should be friendly to the Lagna lord.

=== OUTPUT INSTRUCTIONS ===
Analyze ALL data above. Do not skip difficult placements — debilitations, retrogrades, combustions, malefics in sensitive houses, and afflicted house lords must all be addressed explicitly.

Return ONLY a valid JSON object (no markdown fences, no text outside JSON):

{
  "lifeGeneral": {
    "lifeAnalysis": "<1 brief paragraph: natal life path, core karma, ascendant lord placement and what it means long-term>",
    "transitAnalysis": "<1 brief paragraph: how the current transit period shapes the life path — which houses are activated and the realistic tone>"
  },
  "personality": {
    "lifeAnalysis": "<1 brief paragraph: natal temperament and character from Lagna and Moon sign, including any notable negative traits>",
    "transitAnalysis": "<1 brief paragraph: how current transits are affecting mood, behavior, and self-expression right now>"
  },
  "wealth": {
    "lifeAnalysis": "<1 brief paragraph: natal financial picture from 2nd/11th houses, their lords, any yogas or afflictions>",
    "transitAnalysis": "<1 brief paragraph: current transit effects on wealth — which planets activate or stress 2nd/11th houses now>"
  },
  "familyLife": {
    "lifeAnalysis": "<1 brief paragraph: natal family dynamics from 4th house, including any karmic difficulties or strengths>",
    "transitAnalysis": "<1 brief paragraph: current transit effects on home and family life>"
  },
  "marriageLife": {
    "lifeAnalysis": "<1 brief paragraph: natal marriage prospects from 7th house lord and Venus — delays or strengths>",
    "transitAnalysis": "<1 brief paragraph: current transit influence on relationships and marriage timing>"
  },
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
  "transitOverview": "<Structured transit reading covering every major area of life for the period ${from} to ${to}. For each area below, state in 1-2 sentences what the transits concretely show — name the transiting planet, the house it activates, and the real effect. Do not soften or genericize. If a period within the range is notably better or worse, call it out with approximate dates. Cover ALL of the following areas in order: (1) Career & Work — transits over 10th/6th/1st, Saturn/Jupiter/Sun movement; (2) Wealth, Finance & Losses — transits over 2nd/11th/12th, be blunt and clearly state the effects. 12th house is for loss, so clearly mention loss if it is there but dont if not; (3) Relationships & Marriage — transits over 7th, Venus/Jupiter movement; (4) Health & Energy — transits over 1st/6th/8th, Sun/Moon/Mars state; (5) Family & Home — transits over 4th, Moon/Mars influence; (6) Mental State & Emotions — Moon sign transits, Mercury, Rahu/Ketu axis; (7) Spiritual & Hidden Matters — transits over 8th/12th, Ketu/Saturn themes; (8) Overall Tone — summarize whether this is a period of growth, restriction, transition, or crisis based on the sum of all the above.>",
  "dashaAnalysis": "<1 brief paragraph: analyze the current Mahadasha lord — its natal sign, house, dignity, and planetary relationships. Explain what themes dominate under this dasha (career, family, health, wealth, spirituality), any antardashas if determinable, and how this dasha interacts with the transit period. If the dasha lord is debilitated, combust, or in an enemy sign, state the concrete effects plainly.>"
}`;
  }

  async getAiAnalysis(
    id: number,
    from: string,
    to: string,
    targetYear?: number,
    basis: 'lagna' | 'moon' = 'lagna',
  ): Promise<AiAnalysisResult> {
    this.logger.log(`getAiAnalysis: start id=${id} from=${from} to=${to} year=${targetYear ?? '—'} basis=${basis}`);
    if (!from || !to) throw new BadRequestException('Query params "from" and "to" are required');

    this.logger.log('getAiAnalysis: parallel load chart, moon, transits, numerology, record, ref, mahadasha, saturn, ai-knowledge');
    const [lagnaChart, moonChart, transitData, numerology, record, ref, mahadasha, saturnTransits, knowledge] = await Promise.all([
      this.getChart(id),
      this.getMoonChart(id),
      this.getTransits(id, from, to, basis),
      this.getNumerology(id, targetYear),
      this.loadRecord(id),
      this.loadRefData(),
      this.getMahadasha(id),
      this.getSaturnTransits(id),
      this.getAiKnowledgeText(),
    ]);
    this.logger.log(
      `getAiAnalysis: data loaded transitDays=${transitData.days.length} promptInputs=ok`,
    );

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.error('getAiAnalysis: OPENAI_API_KEY missing');
      throw new BadRequestException('OPENAI_API_KEY is not configured');
    }

    const model  = 'gpt-5-mini';
    const openai = new OpenAI({ apiKey });
    const prompt = this.buildPrompt(record, lagnaChart, moonChart, transitData, numerology, from, to, ref.relMap, mahadasha, saturnTransits, knowledge, basis);
    this.logger.log(`getAiAnalysis: prompt built chars=${prompt.length}`);

    let completion: Awaited<ReturnType<typeof openai.chat.completions.create>>;
    try {
      this.logger.log(`getAiAnalysis: OpenAI request model=${model}`);
      const t0 = Date.now();
      completion = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        // temperature: 0.7,
        max_completion_tokens: 16000,
      });
      this.logger.log(`getAiAnalysis: OpenAI ok ${Date.now() - t0}ms usage=${JSON.stringify(completion.usage ?? {})}`);
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number; error?: unknown };
      this.logger.error(
        `getAiAnalysis: OpenAI API error status=${e?.status} msg=${e?.message ?? err}`,
        JSON.stringify(e?.error ?? {}),
      );
      throw err;
    }

    const content = completion.choices[0]?.message?.content ?? '{}';
    this.logger.log(`getAiAnalysis: response content chars=${content.length}`);

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
    this.logger.log('getAiAnalysis: saved to ai_analyses');

    try {
      const parsed = JSON.parse(content) as AiAnalysisResult;
      this.logger.log('getAiAnalysis: JSON parse OK, returning');
      return parsed;
    } catch (parseErr: unknown) {
      const pe = parseErr as Error;
      this.logger.error(
        `getAiAnalysis: JSON.parse failed ${pe?.message} head=${content.slice(0, 400)}`,
        pe?.stack,
      );
      throw new BadRequestException('AI returned invalid JSON: ' + pe?.message);
    }
  }

  async getHouseAiAnalysis(
    id: number,
    house: number,
    chartKind: 'lagna' | 'moon',
  ): Promise<HouseAiResult> {
    if (house < 1 || house > 12) throw new BadRequestException('house must be 1–12');
    this.logger.log(`getHouseAiAnalysis: id=${id} house=${house} chart=${chartKind}`);

    const [chart, record, knowledge] = await Promise.all([
      chartKind === 'moon' ? this.getMoonChart(id) : this.getChart(id),
      this.loadRecord(id),
      this.getAiKnowledgeText(),
    ]);
    const detail = chart.houseDetails.find(hd => hd.house === house);
    if (!detail) throw new NotFoundException(`House ${house} not found`);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.error('getHouseAiAnalysis: OPENAI_API_KEY missing');
      throw new BadRequestException('OPENAI_API_KEY is not configured');
    }

    const ascLabel =
      chartKind === 'moon'
        ? `Chandra Lagna (Moon as ascendant): ${chart.lagna.sign} ${chart.lagna.degreeInSign.toFixed(2)}°`
        : `Lagna: ${chart.lagna.sign} ${chart.lagna.degreeInSign.toFixed(2)}°`;
    const chartNote =
      chartKind === 'moon'
        ? 'Chandra Lagna chart — houses counted from the Moon sign.'
        : 'Standard Lagna chart — houses counted from the rising sign.';

    const houseBlock = this.fmtHouses([detail]);
    const planetsContext = this.fmtPlanets(chart.planets);

    const knowledgeBlock =
      knowledge.length > 0
        ? `=== VEDIC REFERENCE KNOWLEDGE ===
${knowledge}

`
        : '';

    const prompt = `${knowledgeBlock} You are a Vedic (Jyotish) astrologer. Interpret a single house for this native using whole-sign houses and Lahiri ayanamsa.

Native name: ${record.name}
Chart: ${chartNote}
${ascLabel}
Ayanamsa: ${chart.ayanamsa.toFixed(4)}°

Planetary positions (context):
${planetsContext}

House to interpret:
${houseBlock}

=== INSTRUCTIONS ===
Explain what this house configuration means in practice: Be specific to the data — avoid generic text. Mention opportunities and challenges where the chart shows them. give brief suggestions.

Return ONLY valid JSON (no markdown):
{
  "interpretation": "<1 brief paragraph, plain text>",
  "keyThemes": ["<3-4 short bullet themes>"]
}`;

    const model = 'gpt-5-mini';
    const openai = new OpenAI({ apiKey });
    let completion: Awaited<ReturnType<typeof openai.chat.completions.create>>;
    try {
      const t0 = Date.now();
      completion = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_completion_tokens: 16000,
      });
      this.logger.log(`getHouseAiAnalysis: OpenAI ok ${Date.now() - t0}ms`);
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number };
      this.logger.error(`getHouseAiAnalysis: OpenAI error ${e?.status} ${e?.message ?? err}`);
      throw err;
    }

    const content = completion.choices[0]?.message?.content ?? '{}';
    try {
      return JSON.parse(content) as HouseAiResult;
    } catch (parseErr: unknown) {
      const pe = parseErr as Error;
      this.logger.error(`getHouseAiAnalysis: JSON.parse failed ${pe?.message}`);
      throw new BadRequestException('AI returned invalid JSON: ' + pe?.message);
    }
  }

  async getPlanetRelationships(): Promise<{
    planets: string[];
    relationships: Record<string, Record<string, 'friendly' | 'enemy' | 'neutral'>>;
  }> {
    this.logger.log('getPlanetRelationships: querying DB');
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

    this.logger.log(`getPlanetRelationships: done rows=${rows.length} planets=${planets.length}`);
    return { planets, relationships };
  }

  async listAiAnalyses(birthRecordId: number): Promise<AiAnalysis[]> {
    this.logger.log(`listAiAnalyses: birthRecordId=${birthRecordId}`);
    return this.aiRepo.find({
      where: { birthRecordId },
      order: { createdAt: 'DESC' },
      select: ['id', 'birthRecordId', 'transitFrom', 'transitTo', 'basis', 'model', 'createdAt'],
    });
  }

  async getAiAnalysisById(birthRecordId: number, analysisId: number): Promise<AiAnalysisResult> {
    this.logger.log(`getAiAnalysisById: birthRecordId=${birthRecordId} analysisId=${analysisId}`);
    const row = await this.aiRepo.findOne({ where: { id: analysisId, birthRecordId } });
    if (!row) {
      this.logger.warn(`getAiAnalysisById: not found analysisId=${analysisId}`);
      throw new NotFoundException(`Analysis ${analysisId} not found`);
    }
    return JSON.parse(row.response) as AiAnalysisResult;
  }
}
