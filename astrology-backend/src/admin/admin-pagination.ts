import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page? = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit? = 20;
}

export class BirthRecordsListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  cityQ?: string;

  @IsOptional()
  @IsString()
  timezoneQ?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  createdFrom?: string;

  @IsOptional()
  @IsString()
  createdTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idMax?: number;
}

export class CityListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stateId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  countryId?: number;

  @IsOptional()
  @IsString()
  timezoneQ?: string;

  @IsOptional()
  @IsString()
  typeQ?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  stateCode?: string;
}

export class CountryListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  regionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subregionId?: number;

  @IsOptional()
  @IsString()
  iso2?: string;
}

export class StateListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  countryId?: number;

  @IsOptional()
  @IsString()
  countryCode?: string;
}

export class AiAnalysesListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  birthRecordId?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  basis?: string;

  @IsOptional()
  @IsString()
  transitFrom?: string;

  @IsOptional()
  @IsString()
  transitTo?: string;

  @IsOptional()
  @IsString()
  createdFrom?: string;

  @IsOptional()
  @IsString()
  createdTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idMax?: number;
}

export function getSkipTake(page: number, limit: number) {
  const p = Math.max(1, page || 1);
  const l = Math.min(100, Math.max(1, limit || 20));
  return { page: p, limit: l, skip: (p - 1) * l, take: l };
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function toListResult<T>(items: T[], total: number, page: number, limit: number): ListResult<T> {
  return { items, total, page, limit };
}
