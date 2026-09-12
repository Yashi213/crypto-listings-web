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
import { viewAuth } from '../common/view-session';
import {
  applyLogoUpdateFromForm,
  logoFileMulterOptions,
  logoUrlForCreate,
} from '../uploads/logo-upload.util';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@ApiExcludeController()
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  private nav(auth?: string, user?: string) {
    return {
      ...viewAuth(auth, user),
      pageTitle: 'Активы — Listing Tracker',
      activeListing: false,
      activeFeedback: false,
      activePrivacy: false,
      activeTerms: false,
      activeExchanges: false,
      activeMarketNews: false,
      activeFeedbackAdmin: false,
      activeListingsCrud: false,
      activeAssetsCrud: true,
    };
  }

  @Get('add')
  @Render('assets/add')
  addPage(@Query('auth') auth?: string, @Query('user') user?: string) {
    return this.nav(auth, user);
  }

  @Get(':id/edit')
  @Render('assets/edit')
  async editPage(
    @Param('id') id: string,
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const asset = await this.assetsService.findOne(id);
    return { ...this.nav(auth, user), asset };
  }

  @Get()
  @Render('assets/index')
  async index(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const items = await this.assetsService.findAll();
    return { ...this.nav(auth, user), items };
  }

  @Get(':id')
  @Render('assets/show')
  async show(
    @Param('id') id: string,
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const asset = await this.assetsService.findOne(id);
    return { ...this.nav(auth, user), asset };
  }

  @Post()
  @UseInterceptors(FileInterceptor('logoFile', logoFileMulterOptions()))
  async create(
    @Body() body: CreateAssetDto,
    @UploadedFile() logoFile: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    const created = await this.assetsService.create({
      symbol: body.symbol,
      name: body.name,
      description: body.description,
      website: body.website,
      logoUrl: logoUrlForCreate(logoFile, body.logoUrl) ?? undefined,
    });
    return res.redirect(HttpStatus.FOUND, `/assets/${created.id}`);
  }

  @Post(':id/update')
  @UseInterceptors(FileInterceptor('logoFile', logoFileMulterOptions()))
  async updateForm(
    @Param('id') id: string,
    @Body() body: UpdateAssetDto,
    @UploadedFile() logoFile: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    const prev = await this.assetsService.findOne(id);
    const logoPatch = await applyLogoUpdateFromForm({
      existingLogoUrl: prev.logoUrl,
      file: logoFile,
      body: { logoUrl: body.logoUrl, removeLogo: body.removeLogo },
    });
    await this.assetsService.update(id, {
      symbol: body.symbol,
      name: body.name,
      description: body.description,
      website: body.website,
      ...logoPatch,
    });
    return res.redirect(HttpStatus.FOUND, `/assets/${id}`);
  }

  @Post(':id/delete')
  async removeForm(@Param('id') id: string, @Res() res: Response) {
    await this.assetsService.remove(id);
    return res.redirect(HttpStatus.FOUND, '/assets');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}
