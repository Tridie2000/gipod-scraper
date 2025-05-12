import { Container } from 'inversify';
import { PrismaProvider } from '../providers/prisma.provider';
import { ClosuresService } from '../services/closures.service';
import { ClosuresImportService } from '../services/closures.import.service';

export const container = new Container();

container.bind<PrismaProvider>('PrismaProvider').to(PrismaProvider).inSingletonScope();
container.bind<ClosuresService>('ClosuresService').to(ClosuresService).inSingletonScope();
container.bind<ClosuresImportService>('ClosuresImportService').to(ClosuresImportService).inSingletonScope();
