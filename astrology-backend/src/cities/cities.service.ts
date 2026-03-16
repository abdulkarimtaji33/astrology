import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './city.entity';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private readonly repo: Repository<City>,
  ) {}

  async search(q: string, limit = 10): Promise<City[]> {
    if (!q || q.trim().length < 2) return [];
    return this.repo
      .createQueryBuilder('city')
      .where('city.name LIKE :q', { q: `${q.trim()}%` })
      .orderBy('city.name', 'ASC')
      .limit(Math.min(limit, 20))
      .getMany();
  }
}
