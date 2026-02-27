import { Controller, Get, Query, Redirect, Render } from '@nestjs/common';

interface SessionView {
  isAuth: boolean;
  userName: string;
  activeListing?: boolean;
  activeFeedback?: boolean;
  activePrivacy?: boolean;
  activeTerms?: boolean;
}

function sessionFromQuery(auth: string | undefined, user: string | undefined): SessionView {
  const isAuth = auth === '1' || auth === 'true';
  return {
    isAuth,
    userName: (user as string) || 'Пользователь',
  };
}

function getListingData() {
  const newsCards = [
      { imgSrc: '/img/binance.png', imgAlt: 'Binance', title: 'Binance анонсировал 5 новых листингов', date: '19 января 2024' },
      { imgSrc: '/img/bybit.png', imgAlt: 'Bybit', title: 'Bybit запустил торговлю мемкоинами', date: '18 января 2024' },
      { imgSrc: '/img/okx.png', imgAlt: 'OKX', title: 'OKX добавил поддержку новых сетей', date: '17 января 2024' },
      { imgSrc: '/img/kucoin.png', imgAlt: 'KuCoin', title: 'KuCoin обновил условия листинга', date: '16 января 2024' },
      { imgSrc: '/img/gateio.png', imgAlt: 'Gate.io', title: 'Gate.io расширил список торговых пар', date: '15 января 2024' },
      { imgSrc: '/img/mexc.png', imgAlt: 'MEXC', title: 'MEXC запустил новую программу листинга', date: '14 января 2024' },
      { imgSrc: '/img/binance.png', imgAlt: 'Binance', title: 'Binance добавил поддержку новых токенов', date: '13 января 2024' },
      { imgSrc: '/img/bybit.png', imgAlt: 'Bybit', title: 'Bybit улучшил скорость обработки ордеров', date: '12 января 2024' },
    ];
    const upcomingListings = [
      { title: 'Quantum AI (QAI)', exchange: 'Binance', dateLabel: 'Дата', datetime: '2024-01-20T14:00', dateText: '20 января 14:00 UTC', pairs: 'QAI/USDT, QAI/BTC', extraInserted: 'Добавлена торговая пара QAI/ETH' },
      { title: 'Neural Protocol (NRP)', exchange: 'Bybit', dateLabel: 'Дата', datetime: '2024-01-22T10:00', dateText: '22 января 10:00 UTC', extraDeleted: 'Первоначально планировался на <del>18 января</del>' },
      { title: 'Meta Gaming (MGAME)', exchange: 'OKX', dateLabel: 'Дата', datetime: '2024-01-25T16:30', dateText: '25 января 16:30 UTC', extraImportant: 'Только спот-торговля' },
      { title: 'Stellar Finance (STFI)', exchange: 'KuCoin', dateLabel: 'Дата', datetime: '2024-01-28T12:00', dateText: '28 января 12:00 UTC', pairs: 'STFI/USDT' },
      { title: 'Ocean Protocol (OCN)', exchange: 'Gate.io', dateLabel: 'Дата', datetime: '2024-01-30T09:00', dateText: '30 января 09:00 UTC' },
    ];
    const recentListings = [
      { title: 'Web3 Foundation (W3F)', exchange: 'Binance', dateLabel: 'Дата листинга', dateText: '15 января 2024', changePositive: '+32% с листинга' },
      { title: 'DeFi Alliance (DFA)', exchange: 'Bybit', dateLabel: 'Дата листинга', dateText: '12 января 2024', changeNegative: '-8% с листинга' },
      { title: 'Crypto Venture (CVT)', exchange: 'OKX', dateLabel: 'Дата листинга', dateText: '10 января 2024', features: 'Высокая волатильность' },
      { title: 'Neo Token (NEO)', exchange: 'KuCoin', dateLabel: 'Дата листинга', dateText: '8 января 2024', changePositive: '+15% с листинга' },
      { title: 'Polygon Labs (POL)', exchange: 'Gate.io', dateLabel: 'Дата листинга', dateText: '5 января 2024', changePositive: '+25% с листинга' },
    ];
    const statsRows = [
      { exchange: 'Binance', count: '12', avg: '+45%', best: '+320%', worst: '-15%' },
      { exchange: 'Bybit', count: '18', avg: '+28%', best: '+180%', worst: '-22%' },
      { exchange: 'OKX', count: '15', avg: '+35%', best: '+250%', worst: '-18%' },
      { exchange: 'KuCoin', count: '24', avg: '+22%', best: '+150%', worst: '-30%' },
      { exchange: 'Gate.io', count: '32', avg: '+18%', best: '+120%', worst: '-35%' },
      { exchange: 'MEXC', count: '45', avg: '+15%', best: '+100%', worst: '-40%' },
    ];
    const exchangeLogos = [
      { src: '/img/binance.png', alt: 'Binance' },
      { src: '/img/bybit.png', alt: 'Bybit' },
      { src: '/img/okx.png', alt: 'OKX' },
      { src: '/img/kucoin.png', alt: 'KuCoin' },
      { src: '/img/gateio.png', alt: 'Gate.io' },
      { src: '/img/mexc.png', alt: 'MEXC' },
    ];
    const faq = [
      { question: 'Как часто обновляется информация о листингах?', answer: 'Информация обновляется каждую секунду. Мы напрямую подключаемся по сокету к биржам.' },
      { question: 'Насколько точны даты листингов?', answer: 'Даты указываются на основе официальной информации от бирж. Однако даты могут меняться, о чем мы сразу сообщаем через пометку старая дата и новая дата.' },
      { question: 'Как получать уведомления о новых листингах?', answer: 'Soon' },
    ];
    return {
      activeListing: true,
      activeFeedback: false,
      activePrivacy: false,
      activeTerms: false,
      newsCards,
      upcomingListings,
      recentListings,
      statsRows,
      exchangeLogos,
      faq,
    };
}

@Controller()
export class AppController {
  @Get('login')
  @Redirect('/?auth=1&user=Гость', 302)
  getLogin() {}

  @Get('register')
  @Redirect('/?auth=1&user=Новый%20пользователь', 302)
  getRegister() {}

  @Get()
  @Render('listing')
  getIndexPage(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const session = sessionFromQuery(auth, user);
    return { ...session, ...getListingData() };
  }

  @Get('listing')
  @Render('listing')
  getListingPage(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const session = sessionFromQuery(auth, user);
    return { ...session, ...getListingData() };
  }

  @Get('feedback')
  @Render('feedback')
  getFeedbackPage(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const session = sessionFromQuery(auth, user);
    return {
      ...session,
      activeListing: false,
      activeFeedback: true,
      activePrivacy: false,
      activeTerms: false,
    };
  }

  @Get('privacy')
  @Render('privacy')
  getPrivacyPage(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const session = sessionFromQuery(auth, user);
    return {
      ...session,
      activeListing: false,
      activeFeedback: false,
      activePrivacy: true,
      activeTerms: false,
    };
  }

  @Get('terms')
  @Render('terms')
  getTermsPage(
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const session = sessionFromQuery(auth, user);
    return {
      ...session,
      activeListing: false,
      activeFeedback: false,
      activePrivacy: false,
      activeTerms: true,
    };
  }
}
