import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Max, Min } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, {
    defaultValue: 1,
    description: 'Номер страницы, начиная с 1',
  })
  @Min(1)
  page = 1;

  @Field(() => Int, {
    defaultValue: 20,
    description: 'Размер страницы (максимум 100)',
  })
  @Min(1)
  @Max(100)
  limit = 20;
}
