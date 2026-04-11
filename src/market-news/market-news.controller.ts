import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Render,
  Res,
  Sse,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { viewAuth } from '../common/view-session';
import { ExchangesService } from '../exchanges/exchanges.service';
import { MarketNewsService } from './market-news.service';
import { MarketNewsSseService } from './market-news-sse.service';
import { CreateMarketNewDto } from './dto/create-market-new.dto';
import { UpdateMarketNewDto } from './dto/update-market-new.dto';

@ApiExcludeController()
@Controller('market-news')
export class MarketNewsController {
  constructor(
    private readonly marketNewsService: MarketNewsService,
    private readonly exchangesService: ExchangesService,
    private readonly marketNewsSseService: MarketNewsSseService,
  ) {}

  private nav(auth?: string, user?: string) {
    return {
      ...viewAuth(auth, user),
      pageTitle: 'Новости рынка — Listing Tracker',
      activeListing: false,
      activeFeedback: false,
      activePrivacy: false,
      activeTerms: false,
      activeExchanges: false,
      activeMarketNews: true,
      activeFeedbackAdmin: false,
      activeListingsCrud: false,
      activeAssetsCrud: false,
    };
  }

  @Get('add')
  @Render('market-news/add')
  async addPage(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const exchanges = await this.exchangesService.findAll();
    return { ...this.nav(auth, user), exchanges };
  }

  @Get(':id/edit')
  @Render('market-news/edit')
  async editPage(
    @Param('id') id: string,
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const [news, exchanges] = await Promise.all([
      this.marketNewsService.findOne(id),
      this.exchangesService.findAll(),
    ]);
    const publishedLocal = news.publishedAt.toISOString().slice(0, 16);
    return {
      ...this.nav(auth, user),
      news,
      exchanges,
      publishedLocal,
    };
  }

  @Get()
  @Render('market-news/index')
  async index(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const items = await this.marketNewsService.findAll();
    return { ...this.nav(auth, user), items };
  }

  /** Server-Sent Events: оповещения о новых новостях (главная подписывается через EventSource) */
  @Sse('stream')
  newsStream(): Observable<MessageEvent> {
    return this.marketNewsSseService.events();
  }

  @Get(':id')
  @Render('market-news/show')
  async show(
    @Param('id') id: string,
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const news = await this.marketNewsService.findOne(id);
    return { ...this.nav(auth, user), news };
  }

  @Post()
  async create(@Body() dto: CreateMarketNewDto, @Res() res: Response) {
    const created = await this.marketNewsService.create(dto);
    this.marketNewsSseService.notifyCreated(created);
    return res.redirect(HttpStatus.FOUND, `/market-news/${created.id}`);
  }

  @Post(':id/update')
  async updateForm(
    @Param('id') id: string,
    @Body() body: UpdateMarketNewDto,
    @Res() res: Response,
  ) {
    await this.marketNewsService.update(id, body);
    return res.redirect(HttpStatus.FOUND, `/market-news/${id}`);
  }

  @Post(':id/delete')
  async removeForm(@Param('id') id: string, @Res() res: Response) {
    await this.marketNewsService.remove(id);
    return res.redirect(HttpStatus.FOUND, '/market-news');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMarketNewDto) {
    return this.marketNewsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.marketNewsService.remove(id);
  }
}
