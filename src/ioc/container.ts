import { Container } from 'inversify';
import { GiPodService } from '../services/gipod.service';
import { LdesProvider } from '../providers/ldes.provider';
import { PrismaProvider } from '../providers/prisma.provider';

export const container = new Container();

container.bind<PrismaProvider>('PrismaProvider').to(PrismaProvider).inSingletonScope();
container.bind<LdesProvider>('LdesProvider').to(LdesProvider).inSingletonScope();
container.bind<GiPodService>('GiPodService').to(GiPodService).inSingletonScope();
