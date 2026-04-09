export class CreateFeedbackDto {
  message!: string;
  /** из формы: строка 1–5 или пусто */
  rating?: string;
  /** публичная форма: ФИО */
  displayName?: string;
  /** публичная форма: email */
  email?: string;
}
