import { inject, injectable } from 'inversify';
import { PrismaProvider } from '../providers/prisma.provider';
import axios from 'axios';
import dayjs from 'dayjs';
import lodash from 'lodash';
import { booleanPointInPolygon, centroid } from '@turf/turf';

const geoApi = 'https://geo.api.vlaanderen.be/GIPOD/ogc/features/v1/collections/HINDER';

@injectable()
export class ClosuresImportService {
  public constructor(@inject('PrismaProvider') private prisma: PrismaProvider) {}

  public async import() {
    const dateRanges = this.getDateRanges();
    const features = [];

    for (const dateRange of dateRanges) {
      const response = await axios.get(
        `${geoApi}/items?limit=10000&datetime=${encodeURIComponent(dateRange)}&filter-lang=cql-text`,
      );
      features.push(...response.data.features);
    }

    const uniqueFeatures = lodash.uniqBy(features, 'id');
    const validatedFeatures = uniqueFeatures.filter((feature) => feature.properties.HindranceStatus === 'Gevalideerd');
    const severeFeatures = validatedFeatures.filter(
      (feature) =>
        feature.properties.SevereHindrance &&
        feature.properties.Consequences.includes('Geen doorgang voor gemotoriseerd verkeer') &&
        !feature.properties.HindranceDescription?.includes('Wekelijks'),
    );

    const myArea = {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [4.010353, 51.002522],
            [4.169655, 50.976805],
            [4.162102, 50.888524],
            [3.89637, 50.884193],
            [3.88401, 50.959292],
            [4.010353, 51.002522],
          ],
        ],
      },
      properties: {},
    };

    const severeFeaturesWithinArea = [];
    for (const feature of severeFeatures) {
      const polygon = {
        type: 'Feature',
        geometry: {
          type: 'MultiPolygon',
          coordinates: feature.geometry.coordinates,
        },
        properties: {},
      } as const;
      const center = centroid(polygon);
      const hasIntersection = booleanPointInPolygon(center, myArea);
      if (hasIntersection) {
        severeFeaturesWithinArea.push(feature);
      }
    }

    const featureIds = severeFeaturesWithinArea.map((feature) => feature.id);

    const result = await this.prisma.client.closure.findMany({ select: { id: true } });
    for (const closure of result) {
      if (!featureIds.includes(closure.id)) {
        console.log('Closure deleted:', closure.id);
        await this.prisma.client.closure.delete({ where: { id: closure.id } });
      }
    }

    for (const feature of severeFeaturesWithinArea) {
      // Check if we already know about this feature
      const result = await this.prisma.client.closure.findFirst({ where: { id: feature.id } });
      if (result) {
        // Check if there is an update
        const dateInDatabase = dayjs(result.lastUpdate).toISOString();
        const dateOfFeature = dayjs(feature.properties.HindranceLastModifiedOn).toISOString();
        if (dateInDatabase !== dateOfFeature) {
          console.log('Update on existing closure:', feature.id);
          await this.prisma.client.closure.update({
            where: { id: feature.id },
            data: {
              start: feature.properties.HindranceStart,
              end: feature.properties.HindranceEnd,
              description: feature.properties.HindranceDescription,
              lastUpdate: feature.properties.HindranceLastModifiedOn,
              hindrance: feature.properties.Consequences,
              geometry: JSON.stringify(feature.geometry.coordinates),
              handled: false,
            },
          });
        } else {
          console.log('No changes detected for feature:', feature.id);
        }
      } else {
        console.log('New closure:', feature.id);
        await this.prisma.client.closure.create({
          data: {
            id: feature.id,
            start: feature.properties.HindranceStart,
            end: feature.properties.HindranceEnd,
            description: feature.properties.HindranceDescription,
            lastUpdate: feature.properties.HindranceLastModifiedOn,
            hindrance: feature.properties.Consequences,
            geometry: JSON.stringify(feature.geometry.coordinates),
            handled: false,
          },
        });
      }
    }
  }

  private getDateRanges() {
    const dateRanges = [];
    const tomorrow = dayjs().add(1, 'day').startOf('day');

    for (let i = 0; i < 5; i++) {
      const start = tomorrow.add(i, 'day').startOf('day').toISOString();
      const end = tomorrow.add(i, 'day').endOf('day').toISOString();
      dateRanges.push(`${start}/${end}`);
    }

    return dateRanges;
  }
}
