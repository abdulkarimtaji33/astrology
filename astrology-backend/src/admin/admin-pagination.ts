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

export class CityListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}

export class AiAnalysesListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  birthRecordId?: number;
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
