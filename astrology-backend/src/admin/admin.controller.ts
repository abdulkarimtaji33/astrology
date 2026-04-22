import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateBirthRecordDto } from '../birth-records/dto/create-birth-record.dto';
import { AdminKeyGuard } from './admin-key.guard';
import { AdminService } from './admin.service';
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
import {
  AiAnalysesListQueryDto,
  BirthRecordsListQueryDto,
  CityListQueryDto,
  CountryListQueryDto,
  StateListQueryDto,
} from './admin-pagination';

@Controller('admin')
@UseGuards(AdminKeyGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('health')
  health() {
    return this.admin.health();
  }

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  /* birth records */
  @Get('birth-records')
  listBirth(@Query() q: BirthRecordsListQueryDto) {
    return this.admin.listBirth(q);
  }

  @Get('birth-records/:id')
  getBirth(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getBirth(id);
  }

  @Post('birth-records')
  createBirth(@Body() dto: CreateBirthRecordDto) {
    return this.admin.createBirth(dto);
  }

  @Patch('birth-records/:id')
  patchBirth(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminUpdateBirthRecordDto) {
    return this.admin.updateBirth(id, dto);
  }

  @Delete('birth-records/:id')
  removeBirth(@Param('id', ParseIntPipe) id: number) {
    return this.admin.removeBirth(id).then(() => ({ ok: true }));
  }

  /* ai analyses */
  @Get('ai-analyses')
  listAi(@Query() q: AiAnalysesListQueryDto) {
    return this.admin.listAi(q);
  }

  @Get('ai-analyses/:id')
  getAi(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getAi(id);
  }

  @Post('ai-analyses')
  createAi(@Body() dto: AdminAiAnalysisWriteDto) {
    return this.admin.createAi(dto);
  }

  @Patch('ai-analyses/:id')
  patchAi(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminAiAnalysisPatchDto) {
    return this.admin.patchAi(id, dto);
  }

  @Delete('ai-analyses/:id')
  removeAi(@Param('id', ParseIntPipe) id: number) {
    return this.admin.removeAi(id).then(() => ({ ok: true }));
  }

  /* reference */
  @Get('houses')
  listHouses() {
    return this.admin.listHouses();
  }

  @Get('houses/:id')
  getHouse(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getHouse(id);
  }

  @Put('houses')
  upsertHouse(@Body() dto: AdminHouseWriteDto) {
    return this.admin.upsertHouse(dto);
  }

  @Delete('houses/:id')
  removeHouse(@Param('id', ParseIntPipe) id: number) {
    return this.admin.removeHouse(id).then(() => ({ ok: true }));
  }

  @Get('planets')
  listPlanets() {
    return this.admin.listPlanets();
  }

  @Get('planets/:id')
  getPlanet(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getPlanet(id);
  }

  @Put('planets')
  upsertPlanet(@Body() dto: AdminPlanetWriteDto) {
    return this.admin.upsertPlanet(dto);
  }

  @Delete('planets/:id')
  removePlanet(@Param('id', ParseIntPipe) id: number) {
    return this.admin.removePlanet(id).then(() => ({ ok: true }));
  }

  @Get('zodiac-signs')
  listZodiac() {
    return this.admin.listZodiac();
  }

  @Get('zodiac-signs/:id')
  getZodiac(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getZodiacSign(id);
  }

  @Put('zodiac-signs')
  upsertZodiac(@Body() dto: AdminZodiacWriteDto) {
    return this.admin.upsertZodiac(dto);
  }

  @Delete('zodiac-signs/:id')
  removeZodiac(@Param('id', ParseIntPipe) id: number) {
    return this.admin.removeZodiacSign(id).then(() => ({ ok: true }));
  }

  @Get('planetary-avastha')
  listAvastha() {
    return this.admin.listAvastha();
  }

  @Get('planetary-avastha/:id')
  getAvastha(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getAvastha(id);
  }

  @Put('planetary-avastha')
  upsertAvastha(@Body() dto: AdminAvasthaWriteDto) {
    return this.admin.upsertAvastha(dto);
  }

  @Delete('planetary-avastha/:id')
  removeAvastha(@Param('id', ParseIntPipe) id: number) {
    return this.admin.removeAvastha(id).then(() => ({ ok: true }));
  }

  @Get('planet-relationships')
  listPlanetRel() {
    return this.admin.listPlanetRelationships();
  }

  @Post('planet-relationships')
  createPlanetRel(@Body() dto: AdminPlanetRelationshipWriteDto) {
    return this.admin.createPlanetRel(dto);
  }

  @Patch('planet-relationships/:planetId/:relatedPlanetId')
  patchPlanetRel(
    @Param('planetId', ParseIntPipe) planetId: number,
    @Param('relatedPlanetId', ParseIntPipe) relatedPlanetId: number,
    @Body() dto: AdminPlanetRelPatchDto,
  ) {
    return this.admin.updatePlanetRel(planetId, relatedPlanetId, dto);
  }

  @Delete('planet-relationships/:planetId/:relatedPlanetId')
  removePlanetRel(
    @Param('planetId', ParseIntPipe) planetId: number,
    @Param('relatedPlanetId', ParseIntPipe) relatedPlanetId: number,
  ) {
    return this.admin.removePlanetRel(planetId, relatedPlanetId).then(() => ({ ok: true }));
  }

  @Get('planet-house-interpretations')
  listPhi() {
    return this.admin.listPhi();
  }

  @Get('planet-house-interpretations/:id')
  getPhi(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getPhi(id);
  }

  @Post('planet-house-interpretations')
  createPhi(@Body() dto: AdminPhiWriteDto) {
    return this.admin.createPhi(dto);
  }

  @Patch('planet-house-interpretations/:id')
  patchPhi(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminPhiWriteDto) {
    return this.admin.updatePhi(id, dto);
  }

  @Delete('planet-house-interpretations/:id')
  removePhi(@Param('id', ParseIntPipe) id: number) {
    return this.admin.removePhi(id).then(() => ({ ok: true }));
  }

  @Get('planet-drishti')
  listDrishti() {
    return this.admin.listDrishti();
  }

  @Get('planet-drishti/:id')
  getDrishti(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getDrishti(id);
  }

  @Post('planet-drishti')
  createDrishti(@Body() dto: AdminDrishtiWriteDto) {
    return this.admin.createDrishti(dto);
  }

  @Patch('planet-drishti/:id')
  patchDrishti(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminDrishtiWriteDto) {
    return this.admin.updateDrishti(id, dto);
  }

  @Delete('planet-drishti/:id')
  removeDrishti(@Param('id', ParseIntPipe) id: number) {
    return this.admin.removeDrishti(id).then(() => ({ ok: true }));
  }

  /* geo */
  @Get('regions')
  listRegions() {
    return this.admin.listRegions();
  }

  @Get('regions/:id')
  getRegion(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getRegion(id);
  }

  @Post('regions')
  createRegion(@Body() dto: AdminRegionWriteDto) {
    return this.admin.createRegion(dto);
  }

  @Patch('regions/:id')
  patchRegion(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminRegionWriteDto) {
    return this.admin.updateRegion(id, dto);
  }

  @Delete('regions/:id')
  removeRegion(@Param('id', ParseIntPipe) id: number) {
    return this.admin.removeRegion(id).then(() => ({ ok: true }));
  }

  @Get('subregions')
  listSubregions() {
    return this.admin.listSubregions();
  }

  @Get('subregions/:id')
  getSubregion(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getSubregion(id);
  }

  @Post('subregions')
  createSubregion(@Body() dto: AdminSubregionWriteDto) {
    return this.admin.createSubregion(dto);
  }

  @Patch('subregions/:id')
  patchSubregion(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminSubregionWriteDto) {
    return this.admin.updateSubregion(id, dto);
  }

  @Delete('subregions/:id')
  removeSubregion(@Param('id', ParseIntPipe) id: number) {
    return this.admin.removeSubregion(id).then(() => ({ ok: true }));
  }

  @Get('countries')
  listCountries(@Query() q: CountryListQueryDto) {
    return this.admin.listCountries(q);
  }

  @Get('countries/:id')
  getCountry(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getCountry(id);
  }

  @Post('countries')
  createCountry(@Body() dto: AdminCountryWriteDto) {
    return this.admin.createCountry(dto);
  }

  @Patch('countries/:id')
  patchCountry(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminCountryWriteDto) {
    return this.admin.updateCountry(id, dto);
  }

  @Delete('countries/:id')
  removeCountry(@Param('id', ParseIntPipe) id: number) {
    return this.admin.removeCountry(id).then(() => ({ ok: true }));
  }

  @Get('states')
  listStates(@Query() q: StateListQueryDto) {
    return this.admin.listStates(q);
  }

  @Get('states/:id')
  getState(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getStateRow(id);
  }

  @Post('states')
  createState(@Body() dto: AdminStateWriteDto) {
    return this.admin.createState(dto);
  }

  @Patch('states/:id')
  patchState(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminStateWriteDto) {
    return this.admin.updateState(id, dto);
  }

  @Delete('states/:id')
  removeState(@Param('id', ParseIntPipe) id: number) {
    return this.admin.removeState(id).then(() => ({ ok: true }));
  }

  @Get('cities')
  listCities(@Query() q: CityListQueryDto) {
    return this.admin.listCities(q);
  }

  @Get('cities/:id')
  getCity(@Param('id', ParseIntPipe) id: number) {
    return this.admin.getCity(id);
  }

  @Post('cities')
  createCity(@Body() dto: AdminCityWriteDto) {
    return this.admin.createCity(dto);
  }

  @Patch('cities/:id')
  patchCity(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminCityWriteDto) {
    return this.admin.updateCity(id, dto);
  }

  @Delete('cities/:id')
  removeCity(@Param('id', ParseIntPipe) id: number) {
    return this.admin.removeCity(id).then(() => ({ ok: true }));
  }
}
