import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function Paginated<T>(classRef: Type<T>) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [classRef], { description: 'Элементы текущей страницы' })
    items: T[];

    @Field(() => Int, { description: 'Всего записей' })
    total: number;

    @Field(() => Int, { description: 'Номер текущей страницы' })
    page: number;

    @Field(() => Int, { description: 'Размер страницы' })
    limit: number;
  }
  return PaginatedType;
}

export function toPage<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): Page<T> {
  return { items, total, page, limit };
}
