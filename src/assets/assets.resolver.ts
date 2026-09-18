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
import { ListingsService } from '../listings/listings.service';
import { AssetsService } from './assets.service';
import {
  Asset,
  AssetPage,
  CreateAssetInput,
  UpdateAssetInput,
} from './graphql/asset.types';

@PublicAccess()
@Resolver(() => Asset)
export class AssetsResolver {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly listingsService: ListingsService,
  ) {}

  @Query(() => Asset, { description: 'Один актив по id' })
  asset(@Args('id', { type: () => ID, description: 'ID актива' }) id: string) {
    return this.assetsService.findOne(id);
  }

  @Query(() => AssetPage, {
    description: 'Список активов с пагинацией',
    complexity: paginatedComplexity,
  })
  async assets(@Args() args: PaginationArgs) {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const { items, total } = await this.assetsService.findAllPaginated(
      page,
      limit,
    );
    return toPage(items, total, page, limit);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Asset, { description: 'Создать актив' })
  createAsset(@Args('input') input: CreateAssetInput) {
    return this.assetsService.create(input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Asset, { description: 'Частично обновить актив' })
  updateAsset(
    @Args('id', { type: () => ID, description: 'ID актива' }) id: string,
    @Args('input') input: UpdateAssetInput,
  ) {
    return this.assetsService.update(id, input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Boolean, { description: 'Удалить актив' })
  async removeAsset(
    @Args('id', { type: () => ID, description: 'ID актива' }) id: string,
  ) {
    await this.assetsService.remove(id);
    return true;
  }

  @ResolveField(() => ListingPage, {
    description: 'Листинги, где этот актив основной',
    complexity: paginatedComplexity,
  })
  async listings(@Parent() asset: Asset, @Args() args: PaginationArgs) {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const { items, total } = await this.listingsService.findAllByAssetPaginated(
      asset.id,
      page,
      limit,
    );
    return toPage(items, total, page, limit);
  }
}
