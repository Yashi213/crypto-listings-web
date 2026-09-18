import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { PublicAccess } from '../auth/public-access.decorator';
import { Roles } from '../auth/roles.decorator';
import { paginatedComplexity } from '../graphql/complexity.util';
import { PaginationArgs } from '../graphql/pagination.args';
import { toPage } from '../graphql/paginated';
import { ListingPage } from '../listings/graphql/listing.types';
import { MarketNewsPage } from '../market-news/graphql/market-news.types';
import { ExchangesService } from './exchanges.service';
import {
  CreateExchangeInput,
  Exchange,
  ExchangePage,
  UpdateExchangeInput,
} from './graphql/exchange.types';

@PublicAccess()
@Resolver(() => Exchange)
export class ExchangesResolver {
  constructor(private readonly exchangesService: ExchangesService) {}

  @Query(() => Exchange, { description: 'Одна биржа по id' })
  exchange(
    @Args('id', { type: () => ID, description: 'ID биржи' }) id: string,
  ) {
    return this.exchangesService.findOne(id);
  }

  @Query(() => ExchangePage, {
    description: 'Список бирж с пагинацией',
    complexity: paginatedComplexity,
  })
  async exchanges(@Args() args: PaginationArgs) {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const { items, total } = await this.exchangesService.findAllPaginated(
      page,
      limit,
    );
    return toPage(items, total, page, limit);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Exchange, { description: 'Создать биржу' })
  createExchange(@Args('input') input: CreateExchangeInput) {
    return this.exchangesService.create(input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Exchange, { description: 'Частично обновить биржу' })
  updateExchange(
    @Args('id', { type: () => ID, description: 'ID биржи' }) id: string,
    @Args('input') input: UpdateExchangeInput,
  ) {
    return this.exchangesService.update(id, input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Boolean, { description: 'Удалить биржу' })
  async removeExchange(
    @Args('id', { type: () => ID, description: 'ID биржи' }) id: string,
  ) {
    await this.exchangesService.remove(id);
    return true;
  }

  @ResolveField(() => ListingPage, {
    description: 'Листинги этой биржи',
    complexity: paginatedComplexity,
  })
  async listings(@Parent() exchange: Exchange, @Args() args: PaginationArgs) {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const { items, total } =
      await this.exchangesService.findListingsByExchangePaginated(
        exchange.id,
        page,
        limit,
      );
    return toPage(items, total, page, limit);
  }

  @ResolveField(() => MarketNewsPage, {
    description: 'Новости этой биржи',
    complexity: paginatedComplexity,
  })
  async marketNews(@Parent() exchange: Exchange, @Args() args: PaginationArgs) {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const { items, total } =
      await this.exchangesService.findMarketNewsByExchangePaginated(
        exchange.id,
        page,
        limit,
      );
    return toPage(items, total, page, limit);
  }
}
