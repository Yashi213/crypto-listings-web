import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

export type ListingCreatedPayload = {
  type: 'created';
  id: string;
  title: string;
  exchangeName: string;
  status: string;
};

@Injectable()
export class ListingsSseService {
  private readonly subject = new Subject<ListingCreatedPayload>();

  events(): Observable<MessageEvent> {
    return this.subject.asObservable().pipe(
      map((payload) => ({ data: JSON.stringify(payload) }) as MessageEvent),
    );
  }

  notifyCreated(row: {
    id: string;
    title: string;
    status: string;
    exchange: { name: string };
  }) {
    this.subject.next({
      type: 'created',
      id: row.id,
      title: row.title,
      exchangeName: row.exchange.name,
      status: row.status,
    });
  }
}
