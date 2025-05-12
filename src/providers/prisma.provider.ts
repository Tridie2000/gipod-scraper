import { PrismaClient } from '@prisma/client';
import { injectable } from 'inversify';

@injectable()
export class PrismaProvider {
  private readonly _client: PrismaClient;

  constructor() {
    this._client = new PrismaClient();
  }

  get client(): PrismaClient {
    return this._client;
  }
}
