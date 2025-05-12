import { PrismaClient } from '@prisma/client';
import { injectable } from 'inversify';

/**
 * PrismaProvider is a class responsible for managing the lifecycle and
 * access to the Prisma client instance. It provides a centralized way
 * to use Prisma for database interactions within the application.
 */
@injectable()
export class PrismaProvider {
  /**
   * Retrieves the current Prisma client instance.
   * @returns The Prisma client instance.
   */
  get client(): PrismaClient {
    return this._client;
  }

  private readonly _client: PrismaClient;

  /**
   * Initializes a new instance of the class and creates a new instance of PrismaClient.
   */
  constructor() {
    this._client = new PrismaClient();
  }
}
