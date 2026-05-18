import { IsDateString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class UpdateBirthRecordDto {
  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'birthTime must be HH:mm or HH:mm:ss',
  })
  birthTime?: string;
}
