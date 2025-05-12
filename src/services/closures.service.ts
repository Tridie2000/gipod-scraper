import { inject, injectable } from 'inversify';
import { PrismaProvider } from '../providers/prisma.provider';

@injectable()
export class ClosuresService {
  public constructor(@inject('PrismaProvider') private prisma: PrismaProvider) {}

  public async getAllClosures() {
    return this.prisma.client.closure.findMany();
  }

  public async toggleHandled(id: string) {
    const currentHandledValue = await this.prisma.client.closure.findUniqueOrThrow({
      where: { id },
      select: { id: true, handled: true },
    });
    return this.prisma.client.closure.update({
      where: { id },
      data: { handled: !currentHandledValue.handled },
    });
  }
}
