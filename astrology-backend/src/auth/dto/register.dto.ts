import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Shared password rules used by register, change-password and reset-password. */
export const PASSWORD_RULES = {
  letter: /[A-Za-z]/,
  numberOrSpecial: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
};

export class RegisterDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password must be at most 72 characters' })
  @Matches(PASSWORD_RULES.letter, { message: 'Password must contain at least one letter' })
  @Matches(PASSWORD_RULES.numberOrSpecial, {
    message: 'Password must contain at least one number or special character',
  })
  password: string;
}
