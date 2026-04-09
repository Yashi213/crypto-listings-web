import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { FeedbackService } from './feedback/feedback.service';
import { ListingsService } from './listings/listings.service';

describe('AppController', () => {
  let appController: AppController;

  const listingsServiceMock = {
    getListingPagePayload: jest.fn().mockResolvedValue({
      newsCards: [],
      upcomingListings: [],
      recentListings: [],
      statsRows: [],
      exchangeLogos: [],
      exchangesList: [],
      faq: [],
    }),
  };

  const feedbackServiceMock = {
    findRecent: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: ListingsService, useValue: listingsServiceMock },
        { provide: FeedbackService, useValue: feedbackServiceMock },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('главная страница отдаёт данные для шаблона', async () => {
    const result = await appController.getIndexPage();
    expect(result.pageTitle).toContain('Listing Tracker');
    expect(result.activeListing).toBe(true);
    expect(listingsServiceMock.getListingPagePayload).toHaveBeenCalled();
  });

  it('страница обратной связи подгружает отзывы', async () => {
    const result = await appController.getFeedbackPage();
    expect(result.activeFeedback).toBe(true);
    expect(feedbackServiceMock.findRecent).toHaveBeenCalledWith(15);
  });
});
