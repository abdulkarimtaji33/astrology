import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateReminderDto {
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  /** YYYY-MM-DD */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  sendDate: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  subject: string;

  @IsString()
  @MinLength(1)
  placementDetails: string;

  @IsOptional()
  @IsString()
  note?: string;
}
