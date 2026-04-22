import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { BirthRecord } from '../birth-records/birth-record.entity';
import { AiAnalysis } from '../birth-records/ai-analysis.entity';
import { City } from '../cities/city.entity';
import { CreateBirthRecordDto } from '../birth-records/dto/create-birth-record.dto';
import { House } from '../entities/house.entity';
import { Planet } from '../entities/planet.entity';
import { PlanetRelationship } from '../entities/planet-relationship.entity';
import { PlanetaryAvastha } from '../entities/planetary-avastha.entity';
import { ZodiacSign } from '../entities/zodiac-sign.entity';
import { PlanetHouseInterpretation } from '../entities/planet-house-interpretation.entity';
import { PlanetDrishti } from '../entities/planet-drishti.entity';
import { GeoRegion } from '../entities/region.entity';
import { Subregion } from '../entities/subregion.entity';
import { Country } from '../entities/country.entity';
import { State } from '../entities/state.entity';
import {
  AiAnalysesListQueryDto,
  BirthRecordsListQueryDto,
  CityListQueryDto,
  CountryListQueryDto,
  getSkipTake,
  ListResult,
  StateListQueryDto,
  toListResult,
} from './admin-pagination';
import {
  AdminAiAnalysisPatchDto,
  AdminAiAnalysisWriteDto,
  AdminAvasthaWriteDto,
  AdminCityWriteDto,
  AdminCountryWriteDto,
  AdminDrishtiWriteDto,
  AdminHouseWriteDto,
  AdminPhiWriteDto,
  AdminPlanetRelPatchDto,
  AdminPlanetRelationshipWriteDto,
  AdminPlanetWriteDto,
  AdminRegionWriteDto,
  AdminStateWriteDto,
  AdminSubregionWriteDto,
  AdminUpdateBirthRecordDto,
  AdminZodiacWriteDto,
} from './admin.dtos';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(BirthRecord) private readonly birth: Repository<BirthRecord>,
    @InjectRepository(AiAnalysis) private readonly ai: Repository<AiAnalysis>,
    @InjectRepository(City) private readonly city: Repository<City>,
    @InjectRepository(House) private readonly house: Repository<House>,
    @InjectRepository(Planet) private readonly planet: Repository<Planet>,
    @InjectRepository(PlanetRelationship) private readonly pr: Repository<PlanetRelationship>,
    @InjectRepository(PlanetaryAvastha) private readonly ava: Repository<PlanetaryAvastha>,
    @InjectRepository(ZodiacSign) private readonly zodiac: Repository<ZodiacSign>,
    @InjectRepository(PlanetHouseInterpretation) private readonly phi: Repository<PlanetHouseInterpretation>,
    @InjectRepository(PlanetDrishti) private readonly drishti: Repository<PlanetDrishti>,
    @InjectRepository(GeoRegion) private readonly region: Repository<GeoRegion>,
    @InjectRepository(Subregion) private readonly subregion: Repository<Subregion>,
    @InjectRepository(Country) private readonly country: Repository<Country>,
    @InjectRepository(State) private readonly state: Repository<State>,
  ) {}

  async health(): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async stats() {
    const [
      birthRecords,
      aiAnalyses,
      cities,
      countries,
      states,
      regions,
      planetInterps,
      drishtiRows,
    ] = await Promise.all([
      this.birth.count(),
      this.ai.count(),
      this.city.count(),
      this.country.count(),
      this.state.count(),
      this.region.count(),
      this.phi.count(),
      this.drishti.count(),
    ]);
    return {
      birthRecords,
      aiAnalyses,
      cities,
      countries,
      states,
      regions,
      planetHouseInterpretations: planetInterps,
      planetDrishti: drishtiRows,
    };
  }

  /* --- birth records --- */
  async listBirth(dto: BirthRecordsListQueryDto): Promise<ListResult<BirthRecord>> {
    const { skip, take, page, limit } = getSkipTake(dto.page ?? 1, dto.limit ?? 20);
    const qb = this.birth.createQueryBuilder('br');
    const q = (dto.q ?? '').trim();
    if (q) {
      const like = `%${q}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('br.name LIKE :like', { like })
            .orWhere('br.cityName LIKE :like', { like })
            .orWhere('CAST(br.id AS CHAR) LIKE :like', { like });
        }),
      );
    }
    const cq = (dto.cityQ ?? '').trim();
    if (cq) qb.andWhere('br.cityName LIKE :cq', { cq: `%${cq}%` });
    const tz = (dto.timezoneQ ?? '').trim();
    if (tz) qb.andWhere('br.timezone LIKE :tz', { tz: `%${tz}%` });
    if (dto.dateFrom) qb.andWhere('br.birthDate >= :df', { df: dto.dateFrom });
    if (dto.dateTo) qb.andWhere('br.birthDate <= :dt', { dt: dto.dateTo });
    if (dto.createdFrom) qb.andWhere('br.createdAt >= :cf', { cf: `${dto.createdFrom} 00:00:00` });
    if (dto.createdTo) qb.andWhere('br.createdAt <= :ct', { ct: `${dto.createdTo} 23:59:59.999` });
    if (dto.idMin != null) qb.andWhere('br.id >= :idmin', { idmin: dto.idMin });
    if (dto.idMax != null) qb.andWhere('br.id <= :idmax', { idmax: dto.idMax });
    qb.orderBy('br.createdAt', 'DESC').skip(skip).take(take);
    const [items, total] = await qb.getManyAndCount();
    return toListResult(items, total, page, limit);
  }

  getBirth(id: number) {
    return this.birth.findOneBy({ id }).then((r) => {
      if (!r) throw new NotFoundException('Birth record not found');
      return r;
    });
  }

  createBirth(dto: CreateBirthRecordDto) {
    const e = this.birth.create({
      name: dto.name,
      birthDate: new Date(dto.birthDate),
      birthTime: dto.birthTime,
      cityName: dto.cityName,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezone,
    });
    return this.birth.save(e);
  }

  async updateBirth(id: number, dto: AdminUpdateBirthRecordDto) {
    const e = await this.getBirth(id);
    if (dto.name != null) e.name = dto.name;
    if (dto.birthDate != null) e.birthDate = new Date(dto.birthDate);
    if (dto.birthTime != null) e.birthTime = dto.birthTime;
    if (dto.cityName !== undefined) e.cityName = dto.cityName ?? null;
    if (dto.latitude !== undefined) e.latitude = dto.latitude;
    if (dto.longitude !== undefined) e.longitude = dto.longitude;
    if (dto.timezone !== undefined) e.timezone = dto.timezone ?? null;
    return this.birth.save(e);
  }

  async removeBirth(id: number) {
    const r = await this.birth.delete({ id });
    if (!r.affected) throw new NotFoundException();
  }

  /* --- ai analyses --- */
  async listAi(dto: AiAnalysesListQueryDto): Promise<ListResult<AiAnalysis>> {
    const { skip, take, page, limit } = getSkipTake(dto.page ?? 1, dto.limit ?? 20);
    const qb = this.ai
      .createQueryBuilder('ai')
      .leftJoin(BirthRecord, 'br', 'br.id = ai.birthRecordId');
    if (dto.birthRecordId != null) qb.andWhere('ai.birthRecordId = :brid', { brid: dto.birthRecordId });
    const mq = (dto.q ?? '').trim();
    if (mq) {
      const like = `%${mq}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('ai.prompt LIKE :like', { like })
            .orWhere('ai.response LIKE :like', { like })
            .orWhere('ai.model LIKE :like', { like })
            .orWhere('ai.basis LIKE :like', { like })
            .orWhere('br.name LIKE :like', { like })
            .orWhere('CAST(ai.birthRecordId AS CHAR) LIKE :tid', { tid: `%${mq}%` });
        }),
      );
    }
    if (dto.model?.trim()) qb.andWhere('ai.model LIKE :model', { model: `%${dto.model.trim()}%` });
    if (dto.basis?.trim()) qb.andWhere('ai.basis = :basis', { basis: dto.basis.trim() });
    if (dto.transitFrom?.trim()) qb.andWhere('ai.transitFrom >= :tf', { tf: dto.transitFrom.trim() });
    if (dto.transitTo?.trim()) qb.andWhere('ai.transitTo <= :tt', { tt: dto.transitTo.trim() });
    if (dto.createdFrom) qb.andWhere('ai.createdAt >= :cdf', { cdf: `${dto.createdFrom} 00:00:00` });
    if (dto.createdTo) qb.andWhere('ai.createdAt <= :cdt', { cdt: `${dto.createdTo} 23:59:59.999` });
    if (dto.idMin != null) qb.andWhere('ai.id >= :idmin', { idmin: dto.idMin });
    if (dto.idMax != null) qb.andWhere('ai.id <= :idmax', { idmax: dto.idMax });
    qb.orderBy('ai.id', 'DESC').skip(skip).take(take);
    const [items, total] = await qb.getManyAndCount();
    return toListResult(items, total, page, limit);
  }

  getAi(id: number) {
    return this.ai.findOneBy({ id }).then((r) => {
      if (!r) throw new NotFoundException();
      return r;
    });
  }

  createAi(dto: AdminAiAnalysisWriteDto) {
    return this.ai.save(
      this.ai.create({
        birthRecordId: dto.birthRecordId,
        transitFrom: dto.transitFrom,
        transitTo: dto.transitTo,
        basis: dto.basis,
        model: dto.model,
        prompt: dto.prompt,
        response: dto.response,
      }),
    );
  }

  async patchAi(id: number, dto: AdminAiAnalysisPatchDto) {
    const e = await this.getAi(id);
    if (dto.birthRecordId !== undefined) e.birthRecordId = dto.birthRecordId;
    if (dto.transitFrom !== undefined) e.transitFrom = dto.transitFrom;
    if (dto.transitTo !== undefined) e.transitTo = dto.transitTo;
    if (dto.basis !== undefined) e.basis = dto.basis;
    if (dto.model !== undefined) e.model = dto.model;
    if (dto.prompt !== undefined) e.prompt = dto.prompt;
    if (dto.response !== undefined) e.response = dto.response;
    return this.ai.save(e);
  }

  async removeAi(id: number) {
    const r = await this.ai.delete({ id });
    if (!r.affected) throw new NotFoundException();
  }

  /* --- small reference: all rows --- */
  listHouses() {
    return this.house.find({ order: { id: 'ASC' } });
  }
  getHouse(id: number) {
    return this.house.findOneBy({ id }).then((r) => {
      if (!r) throw new NotFoundException();
      return r;
    });
  }
  async upsertHouse(dto: AdminHouseWriteDto) {
    return this.house.save(
      this.house.create({
        id: dto.id,
        name: dto.name,
        mainTheme: dto.mainTheme,
        represents: dto.represents,
      }),
    );
  }
  async removeHouse(id: number) {
    if (!(await this.house.delete({ id })).affected) throw new NotFoundException();
  }

  listPlanets() {
    return this.planet.find({ order: { id: 'ASC' } });
  }
  getPlanet(id: number) {
    return this.planet.findOneBy({ id }).then((r) => {
      if (!r) throw new NotFoundException();
      return r;
    });
  }
  async upsertPlanet(dto: AdminPlanetWriteDto) {
    return this.planet.save(
      this.planet.create({
        id: dto.id,
        name: dto.name,
        sanskritName: dto.sanskritName,
        type: dto.type,
      }),
    );
  }
  async removePlanet(id: number) {
    if (!(await this.planet.delete({ id })).affected) throw new NotFoundException();
  }

  listZodiac() {
    return this.zodiac.find({ order: { id: 'ASC' } });
  }
  getZodiacSign(id: number) {
    return this.zodiac.findOneBy({ id }).then((r) => {
      if (!r) throw new NotFoundException();
      return r;
    });
  }
  async upsertZodiac(dto: AdminZodiacWriteDto) {
    return this.zodiac.save(
      this.zodiac.create({
        id: dto.id,
        name: dto.name,
        element: dto.element,
        modality: dto.modality,
        ruledBy: dto.ruledBy ?? null,
      }),
    );
  }
  async removeZodiacSign(id: number) {
    if (!(await this.zodiac.delete({ id })).affected) throw new NotFoundException();
  }

  listAvastha() {
    return this.ava.find({ order: { id: 'ASC' } });
  }
  getAvastha(id: number) {
    return this.ava.findOneBy({ id }).then((r) => {
      if (!r) throw new NotFoundException();
      return r;
    });
  }
  async upsertAvastha(dto: AdminAvasthaWriteDto) {
    return this.ava.save(
      this.ava.create({
        id: dto.id,
        name: dto.name,
        englishName: dto.englishName,
        degreeFrom: dto.degreeFrom,
        degreeTo: dto.degreeTo,
        effectPercent: dto.effectPercent,
      }),
    );
  }
  async removeAvastha(id: number) {
    if (!(await this.ava.delete({ id })).affected) throw new NotFoundException();
  }

  listPlanetRelationships() {
    return this.pr.find();
  }
  createPlanetRel(dto: AdminPlanetRelationshipWriteDto) {
    return this.pr.save(
      this.pr.create({
        planetId: dto.planetId,
        relatedPlanetId: dto.relatedPlanetId,
        isFriendly: dto.isFriendly,
      }),
    );
  }
  async updatePlanetRel(
    planetId: number,
    relatedPlanetId: number,
    dto: AdminPlanetRelPatchDto,
  ) {
    const e = await this.pr.findOneBy({ planetId, relatedPlanetId });
    if (!e) throw new NotFoundException();
    if (dto.isFriendly !== undefined) e.isFriendly = dto.isFriendly;
    return this.pr.save(e);
  }
  async removePlanetRel(planetId: number, relatedPlanetId: number) {
    if (!(await this.pr.delete({ planetId, relatedPlanetId })).affected) throw new NotFoundException();
  }

  listPhi() {
    return this.phi.find({ order: { id: 'ASC' } });
  }
  getPhi(id: number) {
    return this.phi.findOneBy({ id }).then((r) => {
      if (!r) throw new NotFoundException();
      return r;
    });
  }
  createPhi(dto: AdminPhiWriteDto) {
    return this.phi.save(
      this.phi.create({
        planetId: dto.planetId,
        houseId: dto.houseId,
        interpretation: dto.interpretation,
      }),
    );
  }
  async updatePhi(id: number, dto: AdminPhiWriteDto) {
    const e = await this.getPhi(id);
    e.planetId = dto.planetId;
    e.houseId = dto.houseId;
    e.interpretation = dto.interpretation;
    return this.phi.save(e);
  }
  async removePhi(id: number) {
    if (!(await this.phi.delete({ id })).affected) throw new NotFoundException();
  }

  listDrishti() {
    return this.drishti.find({ order: { planetId: 'ASC', occupantHouseId: 'ASC', sortOrder: 'ASC' } });
  }
  getDrishti(id: number) {
    return this.drishti.findOneBy({ id }).then((r) => {
      if (!r) throw new NotFoundException();
      return r;
    });
  }
  createDrishti(dto: AdminDrishtiWriteDto) {
    return this.drishti.save(
      this.drishti.create({
        planetId: dto.planetId,
        occupantHouseId: dto.occupantHouseId,
        aspectedHouseId: dto.aspectedHouseId,
        sortOrder: dto.sortOrder ?? 0,
      }),
    );
  }
  async updateDrishti(id: number, dto: AdminDrishtiWriteDto) {
    const e = await this.getDrishti(id);
    e.planetId = dto.planetId;
    e.occupantHouseId = dto.occupantHouseId;
    e.aspectedHouseId = dto.aspectedHouseId;
    e.sortOrder = dto.sortOrder ?? 0;
    return this.drishti.save(e);
  }
  async removeDrishti(id: number) {
    if (!(await this.drishti.delete({ id })).affected) throw new NotFoundException();
  }

  /* --- geo --- */
  listRegions() {
    return this.region.find({ order: { id: 'ASC' } });
  }
  getRegion(id: number) {
    return this.region.findOneBy({ id }).then((r) => {
      if (!r) throw new NotFoundException();
      return r;
    });
  }
  createRegion(dto: AdminRegionWriteDto) {
    if (dto.name == null || !String(dto.name).trim()) {
      throw new BadRequestException('name is required');
    }
    return this.region.save(
      this.region.create({
        name: dto.name,
        translations: dto.translations,
        flag: dto.flag ?? 1,
        wikiDataId: dto.wikiDataId,
      }),
    );
  }
  async updateRegion(id: number, dto: AdminRegionWriteDto) {
    const e = await this.getRegion(id);
    if (dto.name != null) e.name = dto.name;
    if (dto.translations !== undefined) e.translations = dto.translations;
    if (dto.flag != null) e.flag = dto.flag;
    if (dto.wikiDataId !== undefined) e.wikiDataId = dto.wikiDataId;
    return this.region.save(e);
  }
  async removeRegion(id: number) {
    if (!(await this.region.delete({ id })).affected) throw new NotFoundException();
  }

  listSubregions() {
    return this.subregion.find({ order: { id: 'ASC' } });
  }
  getSubregion(id: number) {
    return this.subregion.findOneBy({ id }).then((r) => {
      if (!r) throw new NotFoundException();
      return r;
    });
  }
  createSubregion(dto: AdminSubregionWriteDto) {
    if (dto.name == null || !String(dto.name).trim()) {
      throw new BadRequestException('name is required');
    }
    if (dto.regionId == null) {
      throw new BadRequestException('regionId is required');
    }
    return this.subregion.save(
      this.subregion.create({
        name: dto.name,
        regionId: dto.regionId,
        translations: dto.translations,
        flag: dto.flag ?? 1,
        wikiDataId: dto.wikiDataId,
      }),
    );
  }
  async updateSubregion(id: number, dto: AdminSubregionWriteDto) {
    const e = await this.getSubregion(id);
    if (dto.name != null) e.name = dto.name;
    if (dto.regionId != null) e.regionId = dto.regionId;
    if (dto.translations !== undefined) e.translations = dto.translations;
    if (dto.flag != null) e.flag = dto.flag;
    if (dto.wikiDataId !== undefined) e.wikiDataId = dto.wikiDataId;
    return this.subregion.save(e);
  }
  async removeSubregion(id: number) {
    if (!(await this.subregion.delete({ id })).affected) throw new NotFoundException();
  }

  async listCountries(dto: CountryListQueryDto) {
    const { skip, take, page, limit } = getSkipTake(dto.page ?? 1, dto.limit ?? 20);
    const qb = this.country.createQueryBuilder('c');
    const qq = (dto.q ?? '').trim();
    if (qq) {
      const like = `%${qq}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('c.name LIKE :like', { like })
            .orWhere('c.iso2 LIKE :like', { like })
            .orWhere('c.iso3 LIKE :like', { like });
        }),
      );
    }
    if (dto.regionId != null) qb.andWhere('c.regionId = :rid', { rid: dto.regionId });
    if (dto.subregionId != null) qb.andWhere('c.subregionId = :sid', { sid: dto.subregionId });
    if (dto.iso2?.trim()) qb.andWhere('c.iso2 = :i2', { i2: dto.iso2.trim().toUpperCase() });
    qb.orderBy('c.name', 'ASC').skip(skip).take(take);
    const [items, total] = await qb.getManyAndCount();
    return toListResult(items, total, page, limit);
  }
  getCountry(id: number) {
    return this.country.findOneBy({ id }).then((r) => {
      if (!r) throw new NotFoundException();
      return r;
    });
  }
  createCountry(dto: AdminCountryWriteDto) {
    if (dto.name == null || !String(dto.name).trim()) {
      throw new BadRequestException('name is required');
    }
    return this.country.save(
      this.country.create({
        name: dto.name,
        iso2: dto.iso2,
        iso3: dto.iso3,
        phonecode: dto.phonecode,
        regionId: dto.regionId,
        subregionId: dto.subregionId,
        population: dto.population,
        flag: dto.flag ?? 1,
      }),
    );
  }
  async updateCountry(id: number, dto: AdminCountryWriteDto) {
    const e = await this.getCountry(id);
    if (dto.name != null) e.name = dto.name;
    if (dto.iso2 !== undefined) e.iso2 = dto.iso2;
    if (dto.iso3 !== undefined) e.iso3 = dto.iso3;
    if (dto.phonecode !== undefined) e.phonecode = dto.phonecode;
    if (dto.regionId !== undefined) e.regionId = dto.regionId;
    if (dto.subregionId !== undefined) e.subregionId = dto.subregionId;
    if (dto.population !== undefined) e.population = dto.population;
    if (dto.flag != null) e.flag = dto.flag;
    return this.country.save(e);
  }
  async removeCountry(id: number) {
    if (!(await this.country.delete({ id })).affected) throw new NotFoundException();
  }

  async listStates(dto: StateListQueryDto) {
    const { skip, take, page, limit } = getSkipTake(dto.page ?? 1, dto.limit ?? 20);
    const qb = this.state.createQueryBuilder('s');
    const qq = (dto.q ?? '').trim();
    if (qq) {
      const like = `%${qq}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('s.name LIKE :like', { like })
            .orWhere('s.countryCode LIKE :like', { like })
            .orWhere('s.iso2 LIKE :like', { like });
        }),
      );
    }
    if (dto.countryId != null) qb.andWhere('s.countryId = :cid', { cid: dto.countryId });
    if (dto.countryCode?.trim()) qb.andWhere('s.countryCode = :cc', { cc: dto.countryCode.trim().toUpperCase() });
    qb.orderBy('s.name', 'ASC').skip(skip).take(take);
    const [items, total] = await qb.getManyAndCount();
    return toListResult(items, total, page, limit);
  }
  getStateRow(id: number) {
    return this.state.findOneBy({ id }).then((r) => {
      if (!r) throw new NotFoundException();
      return r;
    });
  }
  createState(dto: AdminStateWriteDto) {
    if (dto.name == null || !String(dto.name).trim()) {
      throw new BadRequestException('name is required');
    }
    if (dto.countryId == null || !String(dto.countryCode ?? '').trim()) {
      throw new BadRequestException('countryId and countryCode are required');
    }
    return this.state.save(
      this.state.create({
        name: dto.name,
        countryId: dto.countryId,
        countryCode: dto.countryCode,
        iso2: dto.iso2,
        flag: dto.flag ?? 1,
      }),
    );
  }
  async updateState(id: number, dto: AdminStateWriteDto) {
    const e = await this.getStateRow(id);
    if (dto.name != null) e.name = dto.name;
    if (dto.countryId != null) e.countryId = dto.countryId;
    if (dto.countryCode != null) e.countryCode = dto.countryCode;
    if (dto.iso2 !== undefined) e.iso2 = dto.iso2;
    if (dto.flag != null) e.flag = dto.flag;
    return this.state.save(e);
  }
  async removeState(id: number) {
    if (!(await this.state.delete({ id })).affected) throw new NotFoundException();
  }

  async listCities(dto: CityListQueryDto): Promise<ListResult<City>> {
    const { skip, take, page, limit } = getSkipTake(dto.page ?? 1, dto.limit ?? 50);
    const qb = this.city.createQueryBuilder('city');
    const q = (dto.q ?? '').trim();
    if (q.length >= 1) {
      const like = `%${q}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('city.name LIKE :like', { like })
            .orWhere('city.countryCode LIKE :like', { like })
            .orWhere('city.stateCode LIKE :like', { like })
            .orWhere('city.native LIKE :like', { like })
            .orWhere('CAST(city.id AS CHAR) LIKE :like', { like });
        }),
      );
    }
    if (dto.stateId != null) qb.andWhere('city.stateId = :stid', { stid: dto.stateId });
    if (dto.countryId != null) qb.andWhere('city.countryId = :cnid', { cnid: dto.countryId });
    if (dto.countryCode?.trim()) qb.andWhere('city.countryCode = :ccd', { ccd: dto.countryCode.trim().toUpperCase() });
    if (dto.stateCode?.trim()) qb.andWhere('city.stateCode LIKE :scd', { scd: `%${dto.stateCode.trim()}%` });
    const tz = (dto.timezoneQ ?? '').trim();
    if (tz) qb.andWhere('city.timezone LIKE :tz', { tz: `%${tz}%` });
    const typ = (dto.typeQ ?? '').trim();
    if (typ) qb.andWhere('city.type LIKE :typ', { typ: `%${typ}%` });
    qb.orderBy('city.id', 'DESC').skip(skip).take(take);
    const [items, total] = await qb.getManyAndCount();
    return toListResult(items, total, page, limit);
  }

  getCity(id: number) {
    return this.city.findOneBy({ id }).then((r) => {
      if (!r) throw new NotFoundException();
      return r;
    });
  }

  createCity(dto: AdminCityWriteDto) {
    if (
      dto.name == null ||
      !String(dto.name).trim() ||
      dto.stateId == null ||
      !String(dto.stateCode ?? '').trim() ||
      dto.countryId == null ||
      !String(dto.countryCode ?? '').trim() ||
      dto.latitude == null ||
      dto.longitude == null
    ) {
      throw new BadRequestException(
        'name, stateId, stateCode, countryId, countryCode, latitude, and longitude are required',
      );
    }
    const now = new Date();
    return this.city.save(
      this.city.create({
        name: dto.name,
        stateId: dto.stateId,
        stateCode: dto.stateCode,
        countryId: dto.countryId,
        countryCode: dto.countryCode,
        type: dto.type,
        level: dto.level,
        parentId: dto.parentId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        native: dto.native,
        population: dto.population,
        timezone: dto.timezone,
        translations: dto.translations,
        createdAt: now,
        updatedAt: now,
        flag: dto.flag ?? 1,
        wikiDataId: dto.wikiDataId,
      }),
    );
  }

  async updateCity(id: number, dto: AdminCityWriteDto) {
    const e = await this.getCity(id);
    if (dto.name != null) e.name = dto.name;
    if (dto.stateId != null) e.stateId = dto.stateId;
    if (dto.stateCode != null) e.stateCode = dto.stateCode;
    if (dto.countryId != null) e.countryId = dto.countryId;
    if (dto.countryCode != null) e.countryCode = dto.countryCode;
    if (dto.latitude != null) e.latitude = dto.latitude;
    if (dto.longitude != null) e.longitude = dto.longitude;
    if (dto.type !== undefined) e.type = dto.type;
    if (dto.level !== undefined) e.level = dto.level;
    if (dto.parentId !== undefined) e.parentId = dto.parentId;
    if (dto.native !== undefined) e.native = dto.native;
    if (dto.population !== undefined) e.population = dto.population;
    if (dto.timezone !== undefined) e.timezone = dto.timezone;
    if (dto.translations !== undefined) e.translations = dto.translations;
    if (dto.flag != null) e.flag = dto.flag;
    if (dto.wikiDataId !== undefined) e.wikiDataId = dto.wikiDataId;
    e.updatedAt = new Date();
    return this.city.save(e);
  }

  async removeCity(id: number) {
    if (!(await this.city.delete({ id })).affected) throw new NotFoundException();
  }
}
