import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Render,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { viewAuth } from '../common/view-session';
import { ListingsService } from './listings.service';
import { AddTradingPairDto } from './dto/add-trading-pair.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  private nav(auth?: string, user?: string) {
    return {
      ...viewAuth(auth, user),
      pageTitle: 'Листинги — Listing Tracker',
      activeListing: false,
      activeFeedback: false,
      activePrivacy: false,
      activeTerms: false,
      activeExchanges: false,
      activeMarketNews: false,
      activeFeedbackAdmin: false,
      activeListingsCrud: true,
      activeAssetsCrud: false,
    };
  }

  @Get('add')
  @Render('listings/add')
  async addPage(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const { exchanges, assets } = await this.listingsService.getFormOptions();
    return { ...this.nav(auth, user), exchanges, assets };
  }

  @Get(':id/edit')
  @Render('listings/edit')
  async editPage(
    @Param('id') id: string,
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const [listing, { exchanges, assets }] = await Promise.all([
      this.listingsService.findOne(id),
      this.listingsService.getFormOptions(),
    ]);
    const dateAtLocal = listing.dateAt.toISOString().slice(0, 16);
    return {
      ...this.nav(auth, user),
      listing,
      exchanges,
      assets,
      dateAtLocal,
    };
  }

  @Get()
  @Render('listings/index')
  async index(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const items = await this.listingsService.findAllForAdmin();
    return { ...this.nav(auth, user), items };
  }

  @Get(':id')
  @Render('listings/show')
  async show(
    @Param('id') id: string,
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const [listing, { assets }] = await Promise.all([
      this.listingsService.findOne(id),
      this.listingsService.getFormOptions(),
    ]);
    return { ...this.nav(auth, user), listing, assets };
  }

  @Post()
  async create(@Body() dto: CreateListingDto, @Res() res: Response) {
    const created = await this.listingsService.create(dto);
    return res.redirect(HttpStatus.FOUND, `/listings/${created.id}`);
  }

  @Post(':id/update')
  async updateForm(
    @Param('id') id: string,
    @Body() body: UpdateListingDto,
    @Res() res: Response,
  ) {
    await this.listingsService.update(id, body);
    return res.redirect(HttpStatus.FOUND, `/listings/${id}`);
  }

  @Post(':id/delete')
  async removeForm(@Param('id') id: string, @Res() res: Response) {
    await this.listingsService.remove(id);
    return res.redirect(HttpStatus.FOUND, '/listings');
  }

  @Post(':id/pairs/:pairId/delete')
  async removePairForm(
    @Param('id') listingId: string,
    @Param('pairId') pairId: string,
    @Res() res: Response,
  ) {
    await this.listingsService.removeTradingPair(listingId, pairId);
    return res.redirect(HttpStatus.FOUND, `/listings/${listingId}`);
  }

  @Post(':id/pairs')
  async addPairForm(
    @Param('id') listingId: string,
    @Body() body: AddTradingPairDto,
    @Res() res: Response,
  ) {
    await this.listingsService.addTradingPair(listingId, body);
    return res.redirect(HttpStatus.FOUND, `/listings/${listingId}`);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateListingDto) {
    return this.listingsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.listingsService.remove(id);
  }
}
