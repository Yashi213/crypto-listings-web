import { PartialType } from '@nestjs/mapped-types';
import { CreateMarketNewDto } from './create-market-new.dto';

export class UpdateMarketNewDto extends PartialType(CreateMarketNewDto) {}
