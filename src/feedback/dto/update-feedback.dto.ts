import {
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';

/** Тело формы POST /feedbacks/:id/update */
export class UpdateFeedbackDto {
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Текст отзыва не менее 10 символов' })
  message?: string;

  @IsOptional()
  @ValidateIf(
    (o: UpdateFeedbackDto) =>
      o.rating !== undefined && String(o.rating).trim() !== '',
  )
  @Matches(/^[1-5]$/)
  rating?: string;
}
