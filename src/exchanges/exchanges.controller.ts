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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { viewAuth } from '../common/view-session';
import {
  applyLogoUpdateFromForm,
  logoFileMulterOptions,
  logoUrlForCreate,
} from '../uploads/logo-upload.util';
import { ExchangesService } from './exchanges.service';
import { CreateExchangeDto } from './dto/create-exchange.dto';
import { UpdateExchangeDto } from './dto/update-exchange.dto';

@Controller('exchanges')
export class ExchangesController {
  constructor(private readonly exchangesService: ExchangesService) {}

  private navExchanges(auth?: string, user?: string) {
    return {
      ...viewAuth(auth, user),
      pageTitle: 'Биржи — Listing Tracker',
      activeListing: false,
      activeFeedback: false,
      activePrivacy: false,
      activeTerms: false,
      activeExchanges: true,
      activeMarketNews: false,
      activeFeedbackAdmin: false,
      activeListingsCrud: false,
      activeAssetsCrud: false,
    };
  }

  @Get('add')
  @Render('exchanges/add')
  addPage(@Query('auth') auth?: string, @Query('user') user?: string) {
    return this.navExchanges(auth, user);
  }

  @Get(':id/edit')
  @Render('exchanges/edit')
  async editPage(
    @Param('id') id: string,
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const exchange = await this.exchangesService.findOne(id);
    return {
      ...this.navExchanges(auth, user),
      exchange,
    };
  }

  @Get()
  @Render('exchanges/index')
  async index(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const exchanges = await this.exchangesService.findAll();
    return {
      ...this.navExchanges(auth, user),
      exchanges,
    };
  }

  @Get(':id')
  @Render('exchanges/show')
  async show(
    @Param('id') id: string,
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const exchange = await this.exchangesService.findOne(id);
    return {
      ...this.navExchanges(auth, user),
      exchange,
    };
  }

  @Post()
  @UseInterceptors(FileInterceptor('logoFile', logoFileMulterOptions()))
  async create(
    @Body() body: CreateExchangeDto,
    @UploadedFile() logoFile: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    const created = await this.exchangesService.create({
      name: body.name,
      website: body.website,
      logoUrl: logoUrlForCreate(logoFile, body.logoUrl) ?? undefined,
    });
    return res.redirect(HttpStatus.FOUND, `/exchanges/${created.id}`);
  }

  @Post(':id/update')
  @UseInterceptors(FileInterceptor('logoFile', logoFileMulterOptions()))
  async updateForm(
    @Param('id') id: string,
    @Body() body: UpdateExchangeDto & { removeLogo?: string },
    @UploadedFile() logoFile: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    const prev = await this.exchangesService.findOne(id);
    const logoPatch = await applyLogoUpdateFromForm({
      existingLogoUrl: prev.logoUrl,
      file: logoFile,
      body: { logoUrl: body.logoUrl, removeLogo: body.removeLogo },
    });
    await this.exchangesService.update(id, {
      name: body.name,
      website: body.website,
      ...logoPatch,
    });
    return res.redirect(HttpStatus.FOUND, `/exchanges/${id}`);
  }

  @Post(':id/delete')
  async removeForm(@Param('id') id: string, @Res() res: Response) {
    await this.exchangesService.remove(id);
    return res.redirect(HttpStatus.FOUND, '/exchanges');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExchangeDto: UpdateExchangeDto) {
    return this.exchangesService.update(id, updateExchangeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exchangesService.remove(id);
  }
}
