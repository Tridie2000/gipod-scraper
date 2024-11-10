import {
  EventStream,
  IEventStreamArgs,
  LDESClient,
  newEngine,
  OutputRepresentation,
} from '@treecg/actor-init-ldes-client';
import { injectable } from 'inversify';
import { gipodContext } from '../types/gipod-context';

@injectable()
export class LdesProvider {
  private client: LDESClient;

  private options: IEventStreamArgs = {
    pollingInterval: 5_000, // millis
    representation: OutputRepresentation.Object,
    emitMemberOnce: true,
    disableSynchronization: true,
    jsonLdContext: gipodContext,
    requestsPerMinute: 10,
  };

  constructor() {
    this.client = newEngine();
  }

  public listen(url: string): EventStream {
    return this.client.createReadStream(url, this.options);
  }
}
