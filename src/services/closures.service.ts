import { inject, injectable } from 'inversify';

import { PrismaProvider } from '../providers/prisma.provider';

/**
 * A service to handle operations related to closures.
 */
@injectable()
export class ClosuresService {
  /**
   * Creates an instance of the class with a PrismaProvider dependency.
   * @param prisma - The PrismaProvider instance to enable database operations.
   */
  public constructor(@inject('PrismaProvider') private prisma: PrismaProvider) {}

  /**
   * Retrieves all closures from the database.
   * @returns A promise that resolves to an array of closure records.
   */
  public async getAllClosures() {
    return this.prisma.client.closure.findMany();
  }

  /**
   * Toggles the 'handled' status of a record identified by the given ID.
   * @param id The unique identifier of the record to update.
   * @returns A promise that resolves to the updated record with the toggled 'handled' status.
   */
  public async toggleHandled(id: string) {
    const currentHandledValue = await this.prisma.client.closure.findUniqueOrThrow({
      select: { handled: true, id: true },
      where: { id },
    });
    return this.prisma.client.closure.update({
      data: { handled: !currentHandledValue.handled },
      where: { id },
    });
  }
}
