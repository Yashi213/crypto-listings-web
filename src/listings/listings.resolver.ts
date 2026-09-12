import { NotFoundException } from '@nestjs/common';
import { Args, ID, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ListingStatus } from '@prisma/client';
import { Asset } from '../assets/graphql/asset.types';
import { paginatedComplexity } from '../graphql/complexity.util';
import { PaginationArgs } from '../graphql/pagination.args';
import { toPage } from '../graphql/paginated';
import { Exchange } from '../exchanges/graphql/exchange.types';
import {
  AddTradingPairInput,
  CreateListingInput,
  Listing,
  ListingPage,
  TradingPair,
  TradingPairPage,
  UpdateListingInput,
} from './graphql/listing.types';
import { ListingsService } from './listings.service';

@Resolver(() => Listing)
export class ListingsResolver {
  constructor(private readonly listingsService: ListingsService) {}

  @Query(() => Listing, { description: 'Один листинг по id' })
  listing(@Args('id', { type: () => ID, description: 'ID листинга' }) id: string) {
    return this.listingsService.findOne(id);
  }

  @Query(() => ListingPage, {
    description: 'Список листингов с пагинацией',
    complexity: paginatedComplexity,
  })
  async listings(@Args() args: PaginationArgs) {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const { items, total } = await this.listingsService.findAllPaginated(
      page,
      limit,
    );
    return toPage(items, total, page, limit);
  }

  @Mutation(() => Listing, { description: 'Создать листинг' })
  createListing(@Args('input') input: CreateListingInput) {
    return this.listingsService.create(input);
  }

  @Mutation(() => Listing, { description: 'Частично обновить листинг' })
  updateListing(
    @Args('id', { type: () => ID, description: 'ID листинга' }) id: string,
    @Args('input') input: UpdateListingInput,
  ) {
    return this.listingsService.update(id, input);
  }

  @Mutation(() => Boolean, { description: 'Удалить листинг' })
  async removeListing(
    @Args('id', { type: () => ID, description: 'ID листинга' }) id: string,
  ) {
    await this.listingsService.remove(id);
    return true;
  }

  @Mutation(() => Listing, {
    description: 'Пометить листинг как предстоящий',
  })
  markListingUpcoming(
    @Args('id', { type: () => ID, description: 'ID листинга' }) id: string,
  ) {
    return this.listingsService.update(id, { status: ListingStatus.UPCOMING });
  }

  @Mutation(() => Listing, {
    description: 'Пометить листинг как недавний (состоявшийся)',
  })
  markListingRecent(
    @Args('id', { type: () => ID, description: 'ID листинга' }) id: string,
  ) {
    return this.listingsService.update(id, { status: ListingStatus.RECENT });
  }

  @Mutation(() => TradingPair, { description: 'Добавить торговую пару к листингу' })
  addListingPair(
    @Args('listingId', { type: () => ID, description: 'ID листинга' })
    listingId: string,
    @Args('input') input: AddTradingPairInput,
  ) {
    return this.listingsService.addTradingPair(listingId, input);
  }

  @Mutation(() => Boolean, { description: 'Удалить торговую пару у листинга' })
  async removeListingPair(
    @Args('listingId', { type: () => ID, description: 'ID листинга' })
    listingId: string,
    @Args('pairId', { type: () => ID, description: 'ID пары' }) pairId: string,
  ) {
    await this.listingsService.removeTradingPair(listingId, pairId);
    return true;
  }

  @ResolveField(() => Exchange, { description: 'Биржа листинга' })
  exchange(
    @Parent()
    listing: Listing & { exchange?: Exchange },
  ) {
    if (!listing.exchange) {
      throw new NotFoundException(`Биржа листинга ${listing.id} не найдена`);
    }
    return listing.exchange;
  }

  @ResolveField(() => Asset, {
    nullable: true,
    description: 'Основной актив листинга',
  })
  asset(
    @Parent()
    listing: Listing & { asset?: Asset | null },
  ) {
    return listing.asset ?? null;
  }

  @ResolveField(() => TradingPairPage, {
    description: 'Торговые пары листинга',
    complexity: paginatedComplexity,
  })
  async pairs(@Parent() listing: Listing, @Args() args: PaginationArgs) {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const { items, total } = await this.listingsService.findPairsPaginated(
      listing.id,
      page,
      limit,
    );
    return toPage(items, total, page, limit);
  }
}

@Resolver(() => TradingPair)
export class TradingPairsResolver {
  @ResolveField(() => Asset, { description: 'Базовый актив пары' })
  baseAsset(
    @Parent()
    pair: TradingPair & { baseAsset?: Asset },
  ) {
    if (!pair.baseAsset) {
      throw new NotFoundException(`Базовый актив пары ${pair.id} не найден`);
    }
    return pair.baseAsset;
  }

  @ResolveField(() => Asset, { description: 'Котируемый актив пары' })
  quoteAsset(
    @Parent()
    pair: TradingPair & { quoteAsset?: Asset },
  ) {
    if (!pair.quoteAsset) {
      throw new NotFoundException(`Котируемый актив пары ${pair.id} не найден`);
    }
    return pair.quoteAsset;
  }
}
