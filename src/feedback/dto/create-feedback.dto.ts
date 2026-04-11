import {
  Allow,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateFeedbackDto {
  /** Поле формы редиректа (не сохраняется в БД) */
  @Allow()
  @IsOptional()
  @IsString()
  next?: string;

  @IsString()
  @MinLength(10, { message: 'Текст отзыва не менее 10 символов' })
  message!: string;

  @IsOptional()
  @ValidateIf((o) => o.rating !== undefined && String(o.rating).trim() !== '')
  @Matches(/^[1-5]$/)
  rating?: string;

  @IsOptional()
  @ValidateIf(
    (o: CreateFeedbackDto) =>
      !!String(o.email ?? '').trim() || !!String(o.displayName ?? '').trim(),
  )
  @IsString()
  @MinLength(3)
  displayName?: string;

  @IsOptional()
  @ValidateIf(
    (o: CreateFeedbackDto) =>
      !!String(o.email ?? '').trim() || !!String(o.displayName ?? '').trim(),
  )
  @IsEmail()
  email?: string;
}
