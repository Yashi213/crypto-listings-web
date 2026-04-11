import { ApiProperty } from '@nestjs/swagger';

/** Ответ после успешного DELETE (тело JSON) */
export class DeleteOkResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
