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
import { ApiExcludeController } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminOnly } from '../auth/roles.decorator';
import { PublicAccess } from '../auth/public-access.decorator';
import { viewAuth } from '../common/view-session';
import { ObjectStorageService } from '../object-storage/object-storage.service';
import { logoFileMulterOptions } from '../uploads/logo-upload.util';
import { ExchangesService } from './exchanges.service';
import { CreateExchangeDto } from './dto/create-exchange.dto';
import { UpdateExchangeDto } from './dto/update-exchange.dto';

@ApiExcludeController()
@Controller('exchanges')
export class ExchangesController {
  constructor(
    private readonly exchangesService: ExchangesService,
    private readonly objectStorage: ObjectStorageService,
  ) {}

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

  @AdminOnly()
  @Get('add')
  @Render('exchanges/add')
  addPage(@Query('auth') auth?: string, @Query('user') user?: string) {
    return this.navExchanges(auth, user);
  }

  @AdminOnly()
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

  @PublicAccess()
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

  @PublicAccess()
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

  @AdminOnly()
  @Post()
  @UseInterceptors(FileInterceptor('logoFile', logoFileMulterOptions()))
  async create(
    @Body() body: CreateExchangeDto,
    @UploadedFile() logoFile: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    const uploadedLogoUrl = logoFile
      ? await this.objectStorage.uploadImage(logoFile, 'exchanges')
      : undefined;
    const created = await this.exchangesService.create({
      name: body.name,
      website: body.website,
      logoUrl: uploadedLogoUrl ?? body.logoUrl,
    });
    return res.redirect(HttpStatus.FOUND, `/exchanges/${created.id}`);
  }

  @AdminOnly()
  @Post(':id/update')
  @UseInterceptors(FileInterceptor('logoFile', logoFileMulterOptions()))
  async updateForm(
    @Param('id') id: string,
    @Body() body: UpdateExchangeDto,
    @UploadedFile() logoFile: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    const uploadedLogoUrl = logoFile
      ? await this.objectStorage.uploadImage(logoFile, 'exchanges')
      : undefined;
    await this.exchangesService.update(id, {
      name: body.name,
      website: body.website,
      logoUrl: uploadedLogoUrl ?? body.logoUrl,
      removeLogo: body.removeLogo,
    });
    return res.redirect(HttpStatus.FOUND, `/exchanges/${id}`);
  }

  @AdminOnly()
  @Post(':id/delete')
  async removeForm(@Param('id') id: string, @Res() res: Response) {
    await this.exchangesService.remove(id);
    return res.redirect(HttpStatus.FOUND, '/exchanges');
  }

  @AdminOnly()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExchangeDto: UpdateExchangeDto) {
    return this.exchangesService.update(id, updateExchangeDto);
  }

  @AdminOnly()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exchangesService.remove(id);
  }
}
