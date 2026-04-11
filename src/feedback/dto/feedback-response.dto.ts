import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class FeedbackUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;
}

export class FeedbackResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty({ nullable: true, minimum: 1, maximum: 5 })
  rating!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ type: () => FeedbackUserResponseDto })
  user!: FeedbackUserResponseDto;
}
