import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateBirthRecordDto } from './dto/create-birth-record.dto';
import { BirthRecord } from './birth-record.entity';
import { calculateChart, LagnaChart, PlanetName } from '../astrology/vedic-calc';

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

@Injectable()
export class BirthRecordsService {
  constructor(
    @InjectRepository(BirthRecord)
    private readonly repo: Repository<BirthRecord>,
    private readonly dataSource: DataSource,
  ) {}

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

  async getChart(id: number): Promise<EnrichedChart> {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Birth record ${id} not found`);

    const dateStr =
      record.birthDate instanceof Date
        ? record.birthDate.toISOString().slice(0, 10)
        : String(record.birthDate).slice(0, 10);

    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute, second = 0] = record.birthTime.split(':').map(Number);

    const lat = record.latitude ? Number(record.latitude) : 20.5937;
    const lon = record.longitude ? Number(record.longitude) : 78.9629;

    const chart = calculateChart(year, month, day, hour, minute, second, lat, lon, record.timezone ?? '');

    // ── Load reference data from DB ──────────────────────────────────────
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

    // planet name → DB id (planets table: 1=Sun,2=Moon,3=Mars,4=Mercury,5=Jupiter,6=Venus,7=Saturn,8=Rahu,9=Ketu)
    const PLANET_DB_ID: Record<PlanetName, number> = {
      Sun: 1, Moon: 2, Mars: 3, Mercury: 4, Jupiter: 5, Venus: 6, Saturn: 7, Rahu: 8, Ketu: 9,
    };

    // sign name → { ruledByPlanetDbId, lordName }
    const signMap = new Map(signRows.map(r => [r.name, { ruledBy: r.ruled_by, lord: r.lord_name }]));

    // house number (1-12) → { mainTheme, represents }
    const houseMap = new Map(houseRows.map(r => [r.id, { mainTheme: r.main_theme, represents: r.represents }]));

    // "planetDbId-lordDbId" → is_friendly (1=friendly, 2=enemy)
    const relMap = new Map(relRows.map(r => [`${r.planet_id}-${r.related_planet_id}`, r.is_friendly]));

    // ── Build enriched house details ─────────────────────────────────────
    const houseDetails: HouseDetail[] = chart.houses.map(h => {
      const sign     = signMap.get(h.sign);
      const houseMeta = houseMap.get(h.house);
      const lordDbId = sign?.ruledBy ?? 0;

      const planets: HousePlanetDetail[] = chart.planets
        .filter(p => p.house === h.house)
        .map(p => {
          const pDbId = PLANET_DB_ID[p.planet as PlanetName];
          let relationship: HousePlanetDetail['relationship'] = 'neutral';

          if (pDbId === lordDbId) {
            relationship = 'own';
          } else if (pDbId && lordDbId) {
            const friendly = relMap.get(`${pDbId}-${lordDbId}`);
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
        house: h.house,
        sign: h.sign,
        signLord: sign?.lord ?? '',
        mainTheme: houseMeta?.mainTheme ?? '',
        represents: houseMeta?.represents ?? '',
        planets,
      };
    });

    return { ...chart, houseDetails };
  }
}
