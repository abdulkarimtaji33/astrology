import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBirthRecordDto } from './dto/create-birth-record.dto';
import { BirthRecord } from './birth-record.entity';
import { calculateChart, LagnaChart } from '../astrology/vedic-calc';

@Injectable()
export class BirthRecordsService {
  constructor(
    @InjectRepository(BirthRecord)
    private readonly repo: Repository<BirthRecord>,
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

  async getChart(id: number): Promise<LagnaChart> {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Birth record ${id} not found`);

    const dateStr =
      record.birthDate instanceof Date
        ? record.birthDate.toISOString().slice(0, 10)
        : String(record.birthDate).slice(0, 10);

    const [year, month, day] = dateStr.split('-').map(Number);
    const timeParts = record.birthTime.split(':').map(Number);
    const hour = timeParts[0];
    const minute = timeParts[1];
    const second = timeParts[2] ?? 0;

    const lat = record.latitude ? Number(record.latitude) : 20.5937;   // default: India center
    const lon = record.longitude ? Number(record.longitude) : 78.9629;

    return calculateChart(year, month, day, hour, minute, second, lat, lon, record.timezone ?? '');
  }
}
