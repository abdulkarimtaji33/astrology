import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanetHouseInterpretation } from '../entities/planet-house-interpretation.entity';
import { PlanetSignInterpretation } from '../entities/planet-sign-interpretation.entity';

const PLANET_IDS: Record<string, number> = {
  Sun: 1, Moon: 2, Mars: 3, Mercury: 4, Jupiter: 5, Venus: 6, Saturn: 7, Rahu: 8, Ketu: 9,
};

const SIGN_IDS: Record<string, number> = {
  Aries: 1, Taurus: 2, Gemini: 3, Cancer: 4, Leo: 5, Virgo: 6,
  Libra: 7, Scorpio: 8, Sagittarius: 9, Capricorn: 10, Aquarius: 11, Pisces: 12,
};

export interface PlacementMeaningResult {
  planet: string;
  house: number | null;
  sign: string | null;
  houseMeaning: string | null;
  signMeaning: string | null;
}

@Injectable()
export class PlacementMeaningsService {
  constructor(
    @InjectRepository(PlanetHouseInterpretation)
    private readonly houseRepo: Repository<PlanetHouseInterpretation>,
    @InjectRepository(PlanetSignInterpretation)
    private readonly signRepo: Repository<PlanetSignInterpretation>,
  ) {}

  async getMeaning(
    planet: string,
    house?: string,
    sign?: string,
  ): Promise<PlacementMeaningResult> {
    const planetId = PLANET_IDS[planet];
    if (!planetId) {
      throw new BadRequestException(`Unknown planet "${planet}"`);
    }

    let houseId: number | undefined;
    if (house !== undefined) {
      houseId = parseInt(house, 10);
      if (Number.isNaN(houseId) || houseId < 1 || houseId > 12) {
        throw new BadRequestException('Query "house" must be an integer 1-12');
      }
    }

    let signId: number | undefined;
    if (sign !== undefined) {
      signId = SIGN_IDS[sign];
      if (!signId) {
        throw new BadRequestException(`Unknown sign "${sign}"`);
      }
    }

    const [houseRow, signRow] = await Promise.all([
      houseId
        ? this.houseRepo.findOne({ where: { planetId, houseId } })
        : Promise.resolve(null),
      signId
        ? this.signRepo.findOne({ where: { planetId, signId } })
        : Promise.resolve(null),
    ]);

    return {
      planet,
      house: houseId ?? null,
      sign: sign ?? null,
      houseMeaning: houseRow?.interpretation ?? null,
      signMeaning: signRow?.interpretation ?? null,
    };
  }
}
