import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_RULES } from './register.dto';

class NewPassword {
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password must be at most 72 characters' })
  @Matches(PASSWORD_RULES.letter, { message: 'Password must contain at least one letter' })
  @Matches(PASSWORD_RULES.numberOrSpecial, {
    message: 'Password must contain at least one number or special character',
  })
  newPassword: string;
}

export class ChangePasswordDto extends NewPassword {
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  @MaxLength(128)
  currentPassword: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(255)
  email: string;
}

export class ResetPasswordDto extends NewPassword {
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  token: string;
}
