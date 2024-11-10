import { inject, injectable } from 'inversify';
import { LdesProvider } from '../providers/ldes.provider';
import { MobilityHindrance } from '../types/mobility-hindrance';
import { PrismaProvider } from '../providers/prisma.provider';

@injectable()
export class GiPodService {
  private mobilityHindrancesApi = 'https://private-api.gipod.beta-vlaanderen.be/api/v1/ldes/mobility-hindrances';

  private allowedHindrances = [
    'b133bb2c-98b7-4485-9ef8-7513e73d63d7', // Handelaars moeilijk bereikbaar
    'a96c15e7-a3cf-41b1-aa6a-e8eb53ea7f3c', // Tijdelijk tweerichtingsverkeer
    'b922f580-68d3-471d-8712-8175417ad769', // Rijrichting omgekeerd
    'e52587c7-5566-4c1c-889c-7fcc947e4c4b', // Afgesloten in 1 rijrichting uitgezonderd openbaar vervoer
    '5e5a1a0b-eaab-4b98-a5c8-6a4664cdb909', // Afgesloten in 1 rijrichting uitgezonderd hulpdiensten
    'ee31fd67-b75e-4499-9ad4-0a595717a9c7', // Afgesloten in 1 rijrichting
    '23c9463a-c199-4db3-a8ce-40a088066cb3', // Geen doorgang voor gemotoriseerd verkeer uitgezonderd plaatselijk verkeer
    '6dd14722-79ad-4d25-aa0e-91e7fc53877b', // Geen doorgang voor gemotoriseerd verkeer uitgezonderd openbaar vervoer
    '4981fd46-9536-415b-bd30-e53c0cedd799', // Geen doorgang voor gemotoriseerd verkeer uitgezonderd hulpdiensten
    'c53813ab-814f-4ff4-8a87-6934c72e175f', // Geen doorgang voor gemotoriseerd verkeer
    '6516ffed-b259-4bf2-9013-47b19e709d93', // Gemotoriseerd verkeer
  ];

  constructor(
    @inject('LdesProvider') private readonly ldesProvider: LdesProvider,
    @inject('PrismaProvider') private readonly prisma: PrismaProvider,
  ) {}

  public listen() {
    const stream = this.ldesProvider.listen(this.mobilityHindrancesApi);
    stream.on('error', (err) => this.onError(err));
    stream.on('end', () => this.onEnd());
    stream.on('data', (data) => this.onData(JSON.stringify(data)));
  }

  private onError(error: Error) {
    console.error(error);
  }

  private onEnd() {
    console.info('END');
  }

  private async onData(data: string) {
    const _data = JSON.parse(data).object as MobilityHindrance;

    // Check if the hindrance type is of interest
    const interestingHindrance = _data.zone.some((zone) => this.isInterestingConsequence(zone.consequence?.id));
    console.debug('Interest:', interestingHindrance);
    if (!interestingHindrance) return;

    // Sync the hindrance state
    await this.prisma.client.closure.upsert({
      where: {
        id: _data.gipodId.value,
      },
      create: {
        id: _data.gipodId.value,
        start: _data.period[0]!.start,
        end: _data.period[0]!.end,
        description: _data.description,
        lastUpdate: _data.lastModifiedOn,
        hindrance: _data.zone[0]!.consequence!.prefLabel,
        geometry: _data.zone[0]!.geometry.wkt,
      },
      update: {
        start: _data.period[0]!.start,
        end: _data.period[0]!.end,
        description: _data.description,
        lastUpdate: _data.lastModifiedOn,
        hindrance: _data.zone[0]!.consequence!.prefLabel,
        geometry: _data.zone[0]!.geometry.wkt,
      },
    });
  }

  private isInterestingConsequence(id: string | undefined): boolean {
    if (id === undefined) return false;
    const uuid = id.split('api/v1/taxonomies/mobility-hindrance/consequencetypes/')[1];
    if (!uuid) return false;
    return this.allowedHindrances.includes(uuid);
  }
}
