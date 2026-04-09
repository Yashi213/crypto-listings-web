import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

/** Полезная нагрузка SSE при появлении новой новости рынка */
export type MarketNewsCreatedPayload = {
  type: 'created';
  id: string;
  title: string;
  exchangeName: string;
};

@Injectable()
export class MarketNewsSseService {
  private readonly subject = new Subject<MarketNewsCreatedPayload>();

  /** Поток для @Sse() — каждое подключение подписывается на общий Subject */
  events(): Observable<MessageEvent> {
    return this.subject.asObservable().pipe(
      map(
        (payload) =>
          ({ data: JSON.stringify(payload) }) as MessageEvent,
      ),
    );
  }

  notifyCreated(row: {
    id: string;
    title: string;
    exchange: { name: string };
  }) {
    this.subject.next({
      type: 'created',
      id: row.id,
      title: row.title,
      exchangeName: row.exchange.name,
    });
  }
}
