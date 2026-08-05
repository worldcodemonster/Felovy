import { EventEmitter } from 'events';
import type { ScrapeEvent, TokenVerifyProgress } from '@/lib/board-search-types';

/** In-process event bus for scrape progress and token verify (SSE subscribers). */
class BoardSearchEventBus extends EventEmitter {
  emitProgress(progress: TokenVerifyProgress): void {
    this.emit('verify:progress', progress);
  }

  emitScrape(event: ScrapeEvent): void {
    this.emit('scrape:event', event);
  }

  emitAgents(): void {
    this.emit('scrape:agents');
  }

  emitRotation(): void {
    this.emit('scrape:rotation');
  }
}

export const boardSearchEvents = new BoardSearchEventBus();
