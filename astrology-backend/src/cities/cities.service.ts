import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './city.entity';

@Injectable()
export class CitiesService {
  private readonly logger = new Logger(CitiesService.name);

  constructor(
    @InjectRepository(City)
    private readonly repo: Repository<City>,
  ) {}

  async search(q: string, limit = 10): Promise<City[]> {
    this.logger.log(`search: q="${q}" limit=${limit}`);
    if (!q || q.trim().length < 2) return [];
    const rows = await this.repo
      .createQueryBuilder('city')
      .where('city.name LIKE :q', { q: `${q.trim()}%` })
      .orderBy('city.name', 'ASC')
      .limit(Math.min(limit, 20))
      .getMany();
    this.logger.log(`search: found ${rows.length} rows`);
    return rows;
  }
}
