import { NotFoundException } from '@nestjs/common';
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
import { Exchange } from '../exchanges/graphql/exchange.types';
import { paginatedComplexity } from '../graphql/complexity.util';
import { PaginationArgs } from '../graphql/pagination.args';
import { toPage } from '../graphql/paginated';
import {
  CreateMarketNewsInput,
  MarketNews,
  MarketNewsPage,
  UpdateMarketNewsInput,
} from './graphql/market-news.types';
import { MarketNewsService } from './market-news.service';

@PublicAccess()
@Resolver(() => MarketNews)
export class MarketNewsResolver {
  constructor(private readonly marketNewsService: MarketNewsService) {}

  @Query(() => MarketNews, { description: 'Одна новость по id' })
  marketNewsItem(
    @Args('id', { type: () => ID, description: 'ID новости' }) id: string,
  ) {
    return this.marketNewsService.findOne(id);
  }

  @Query(() => MarketNewsPage, {
    description: 'Список новостей с пагинацией',
    complexity: paginatedComplexity,
  })
  async marketNewsList(@Args() args: PaginationArgs) {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const { items, total } = await this.marketNewsService.findAllPaginated(
      page,
      limit,
    );
    return toPage(items, total, page, limit);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => MarketNews, { description: 'Создать новость' })
  createMarketNews(@Args('input') input: CreateMarketNewsInput) {
    return this.marketNewsService.create(input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => MarketNews, { description: 'Частично обновить новость' })
  updateMarketNews(
    @Args('id', { type: () => ID, description: 'ID новости' }) id: string,
    @Args('input') input: UpdateMarketNewsInput,
  ) {
    return this.marketNewsService.update(id, input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Boolean, { description: 'Удалить новость' })
  async removeMarketNews(
    @Args('id', { type: () => ID, description: 'ID новости' }) id: string,
  ) {
    await this.marketNewsService.remove(id);
    return true;
  }

  @ResolveField(() => Exchange, { description: 'Биржа-источник новости' })
  exchange(
    @Parent()
    news: MarketNews & { exchange?: Exchange },
  ) {
    if (!news.exchange) {
      throw new NotFoundException(`Биржа новости ${news.id} не найдена`);
    }
    return news.exchange;
  }
}
