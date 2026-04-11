import { PartialType } from '@nestjs/mapped-types';
import { Allow, IsOptional, IsString } from 'class-validator';
import { CreateAssetDto } from './create-asset.dto';

export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  @Allow()
  @IsOptional()
  @IsString()
  removeLogo?: string;
}
