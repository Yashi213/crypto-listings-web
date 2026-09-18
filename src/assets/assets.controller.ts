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
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@ApiExcludeController()
@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly objectStorage: ObjectStorageService,
  ) {}

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

  @AdminOnly()
  @Get('add')
  @Render('assets/add')
  addPage(@Query('auth') auth?: string, @Query('user') user?: string) {
    return this.nav(auth, user);
  }

  @AdminOnly()
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

  @PublicAccess()
  @Get()
  @Render('assets/index')
  async index(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const items = await this.assetsService.findAll();
    return { ...this.nav(auth, user), items };
  }

  @PublicAccess()
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

  @AdminOnly()
  @Post()
  @UseInterceptors(FileInterceptor('logoFile', logoFileMulterOptions()))
  async create(
    @Body() body: CreateAssetDto,
    @UploadedFile() logoFile: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    const uploadedLogoUrl = logoFile
      ? await this.objectStorage.uploadImage(logoFile, 'assets')
      : undefined;
    const created = await this.assetsService.create({
      symbol: body.symbol,
      name: body.name,
      description: body.description,
      website: body.website,
      logoUrl: uploadedLogoUrl ?? body.logoUrl,
    });
    return res.redirect(HttpStatus.FOUND, `/assets/${created.id}`);
  }

  @AdminOnly()
  @Post(':id/update')
  @UseInterceptors(FileInterceptor('logoFile', logoFileMulterOptions()))
  async updateForm(
    @Param('id') id: string,
    @Body() body: UpdateAssetDto,
    @UploadedFile() logoFile: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    const uploadedLogoUrl = logoFile
      ? await this.objectStorage.uploadImage(logoFile, 'assets')
      : undefined;
    await this.assetsService.update(id, {
      symbol: body.symbol,
      name: body.name,
      description: body.description,
      website: body.website,
      logoUrl: uploadedLogoUrl ?? body.logoUrl,
      removeLogo: body.removeLogo,
    });
    return res.redirect(HttpStatus.FOUND, `/assets/${id}`);
  }

  @AdminOnly()
  @Post(':id/delete')
  async removeForm(@Param('id') id: string, @Res() res: Response) {
    await this.assetsService.remove(id);
    return res.redirect(HttpStatus.FOUND, '/assets');
  }

  @AdminOnly()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.update(id, dto);
  }

  @AdminOnly()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}
