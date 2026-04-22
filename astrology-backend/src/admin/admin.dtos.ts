import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

/* birth records */
export class AdminUpdateBirthRecordDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsDateString() birthDate?: string;
  @IsOptional() @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/) birthTime?: string;
  @IsOptional() @IsString() cityName?: string;
  @IsOptional() @IsNumber() @Min(-90) @Max(90) latitude?: number;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) longitude?: number;
  @IsOptional() @IsString() timezone?: string;
}

export class AdminPlanetWriteDto {
  @IsInt() @Min(1) id: number;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() sanskritName?: string;
  @IsOptional() @IsString() type?: string;
}

export class AdminHouseWriteDto {
  @IsInt() @Min(1) @Max(12) id: number;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() mainTheme?: string;
  @IsOptional() @IsString() represents?: string;
}

export class AdminZodiacWriteDto {
  @IsInt() @Min(1) @Max(12) id: number;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() element?: string;
  @IsOptional() @IsString() modality?: string;
  @IsOptional() @Type(() => Number) @IsInt() ruledBy?: number | null;
}

export class AdminAvasthaWriteDto {
  @IsInt() @Min(0) id: number;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() englishName?: string;
  @IsOptional() @IsString() degreeFrom?: string;
  @IsOptional() @IsString() degreeTo?: string;
  @IsOptional() @Type(() => Number) @IsInt() effectPercent?: number | null;
}

export class AdminPlanetRelationshipWriteDto {
  @Type(() => Number) @IsInt() planetId: number;
  @Type(() => Number) @IsInt() relatedPlanetId: number;
  @IsOptional() @Type(() => Number) @IsInt() isFriendly?: number | null;
}

export class AdminPlanetRelPatchDto {
  @IsOptional() @Type(() => Number) @IsInt() isFriendly?: number | null;
}

export class AdminPhiWriteDto {
  @IsOptional() @Type(() => Number) @IsInt() id?: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(9) planetId: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(12) houseId: number;
  @IsNotEmpty() @IsString() interpretation: string;
}

export class AdminDrishtiWriteDto {
  @IsOptional() @Type(() => Number) @IsInt() id?: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(9) planetId: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(12) occupantHouseId: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(12) aspectedHouseId: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(255) sortOrder?: number;
}

export class AdminAiAnalysisWriteDto {
  @Type(() => Number) @IsInt() birthRecordId: number;
  @IsString() transitFrom: string;
  @IsString() transitTo: string;
  @IsString() basis: string;
  @IsString() model: string;
  @IsString() prompt: string;
  @IsString() response: string;
}

export class AdminAiAnalysisPatchDto {
  @IsOptional() @Type(() => Number) @IsInt() birthRecordId?: number;
  @IsOptional() @IsString() transitFrom?: string;
  @IsOptional() @IsString() transitTo?: string;
  @IsOptional() @IsString() basis?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() prompt?: string;
  @IsOptional() @IsString() response?: string;
}

/* Geo — partial updates use string fields; numeric ids as numbers */
export class AdminRegionWriteDto {
  @IsOptional() @Type(() => Number) @IsInt() id?: number;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() translations?: string;
  @IsOptional() @Type(() => Number) @IsInt() flag?: number;
  @IsOptional() @IsString() wikiDataId?: string;
}

export class AdminSubregionWriteDto {
  @IsOptional() @Type(() => Number) @IsInt() id?: number;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @Type(() => Number) @IsInt() regionId?: number;
  @IsOptional() @IsString() translations?: string;
  @IsOptional() @Type(() => Number) @IsInt() flag?: number;
  @IsOptional() @IsString() wikiDataId?: string;
}

export class AdminCountryWriteDto {
  @IsOptional() @Type(() => Number) @IsInt() id?: number;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() iso2?: string;
  @IsOptional() @IsString() iso3?: string;
  @IsOptional() @IsString() phonecode?: string;
  @IsOptional() @Type(() => Number) @IsInt() regionId?: number;
  @IsOptional() @Type(() => Number) @IsInt() subregionId?: number;
  @IsOptional() @IsString() population?: string;
  @IsOptional() @Type(() => Number) @IsInt() flag?: number;
}

export class AdminStateWriteDto {
  @IsOptional() @Type(() => Number) @IsInt() id?: number;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @Type(() => Number) @IsInt() countryId?: number;
  @IsOptional() @IsString() countryCode?: string;
  @IsOptional() @IsString() iso2?: string;
  @IsOptional() @Type(() => Number) @IsInt() flag?: number;
}

export class AdminCityWriteDto {
  @IsOptional() @Type(() => Number) @IsInt() id?: number;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @Type(() => Number) @IsInt() stateId?: number;
  @IsOptional() @IsString() stateCode?: string;
  @IsOptional() @Type(() => Number) @IsInt() countryId?: number;
  @IsOptional() @IsString() countryCode?: string;
  @IsOptional() @IsString() latitude?: string;
  @IsOptional() @IsString() longitude?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @Type(() => Number) @IsInt() level?: number;
  @IsOptional() @Type(() => Number) @IsInt() parentId?: number;
  @IsOptional() @IsString() native?: string;
  @IsOptional() @IsString() population?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() translations?: string;
  @IsOptional() @Type(() => Number) @IsInt() flag?: number;
  @IsOptional() @IsString() wikiDataId?: string;
}
