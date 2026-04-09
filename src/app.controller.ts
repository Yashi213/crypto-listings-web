import { Controller, Get, Query, Redirect, Render } from '@nestjs/common';
import { viewAuth } from './common/view-session';
import { FeedbackService } from './feedback/feedback.service';
import { ListingsService } from './listings/listings.service';

@Controller()
export class AppController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly feedbackService: FeedbackService,
  ) {}

  @Get('login')
  @Redirect('/?auth=1&user=Гость', 302)
  getLogin() {}

  @Get('register')
  @Redirect('/?auth=1&user=Новый%20пользователь', 302)
  getRegister() {}

  @Get()
  @Render('listing')
  async getIndexPage(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const payload = await this.listingsService.getListingPagePayload();
    return {
      ...viewAuth(auth, user),
      ...payload,
      pageTitle: 'Listing Tracker - отслеживание новых листингов',
      activeListing: true,
      activeFeedback: false,
      activePrivacy: false,
      activeTerms: false,
      activeExchanges: false,
      activeMarketNews: false,
      activeFeedbackAdmin: false,
      activeListingsCrud: false,
      activeAssetsCrud: false,
    };
  }

  @Get('listing')
  @Render('listing')
  async getListingPage(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const payload = await this.listingsService.getListingPagePayload();
    return {
      ...viewAuth(auth, user),
      ...payload,
      pageTitle: 'Listing Tracker - отслеживание новых листингов',
      activeListing: true,
      activeFeedback: false,
      activePrivacy: false,
      activeTerms: false,
      activeExchanges: false,
      activeMarketNews: false,
      activeFeedbackAdmin: false,
      activeListingsCrud: false,
      activeAssetsCrud: false,
    };
  }

  @Get('feedback')
  @Render('feedback')
  async getFeedbackPage(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
    @Query('saved') saved?: string,
  ) {
    const recentFeedbacks = await this.feedbackService.findRecent(15);
    return {
      ...viewAuth(auth, user),
      pageTitle: 'Обратная связь - Listing Tracker',
      recentFeedbacks,
      showSaved: saved === '1' || saved === 'true',
      activeListing: false,
      activeFeedback: true,
      activePrivacy: false,
      activeTerms: false,
      activeExchanges: false,
      activeMarketNews: false,
      activeFeedbackAdmin: false,
      activeListingsCrud: false,
      activeAssetsCrud: false,
    };
  }

  @Get('privacy')
  @Render('privacy')
  getPrivacyPage(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    return {
      ...viewAuth(auth, user),
      pageTitle: 'Политика конфиденциальности - Listing Tracker',
      activeListing: false,
      activeFeedback: false,
      activePrivacy: true,
      activeTerms: false,
      activeExchanges: false,
      activeMarketNews: false,
      activeFeedbackAdmin: false,
      activeListingsCrud: false,
      activeAssetsCrud: false,
    };
  }

  @Get('terms')
  @Render('terms')
  getTermsPage(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    return {
      ...viewAuth(auth, user),
      pageTitle: 'Условия использования - Listing Tracker',
      activeListing: false,
      activeFeedback: false,
      activePrivacy: false,
      activeTerms: true,
      activeExchanges: false,
      activeMarketNews: false,
      activeFeedbackAdmin: false,
      activeListingsCrud: false,
      activeAssetsCrud: false,
    };
  }
}
