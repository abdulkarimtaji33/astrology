import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateBirthRecordDto } from './dto/create-birth-record.dto';
import { BirthRecord } from './birth-record.entity';
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
export class BirthRecordsService {
  constructor(
    @InjectRepository(BirthRecord)
    private readonly repo: Repository<BirthRecord>,
    private readonly dataSource: DataSource,
  ) {}

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
    return calculateNumerology(day, month, year, targetYear);
  }
}
