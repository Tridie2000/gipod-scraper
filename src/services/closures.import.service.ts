import { booleanPointInPolygon, centroid } from '@turf/turf';
import axios from 'axios';
import dayjs from 'dayjs';
import { inject, injectable } from 'inversify';
import lodash from 'lodash';

import { PrismaProvider } from '../providers/prisma.provider';

const geoApi = 'https://geo.api.vlaanderen.be/GIPOD/ogc/features/v1/collections/HINDER';

/**
 * A service responsible for importing closure data from a remote API,
 * validating and filtering the data, checking intersection with a predefined area,
 * and updating the internal database based on the processed information.
 */
@injectable()
export class ClosuresImportService {
  /**
   * Constructs an instance of the class with the provided PrismaProvider dependency.
   * @param prisma - The PrismaProvider instance used for database operations.
   * @returns An instance of the class initialized with the given PrismaProvider.
   */
  public constructor(@inject('PrismaProvider') private prisma: PrismaProvider) {}

  /**
   * Imports data from an external API, processes it to identify relevant features based on specific criteria,
   * and updates the database to reflect the current state of closures by creating, updating, or deleting records.
   *
   * The method involves fetching data for specific date ranges, filtering and validating the features based on
   * their properties, checking for intersections with a predefined area, and then comparing the filtered features
   * with the existing database records to determine changes or updates needed.
   * @returns A promise that resolves once the import and database updates are complete.
   */
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
      geometry: {
        coordinates: [
          [
            [4.010_353, 51.002_522],
            [4.169_655, 50.976_805],
            [4.162_102, 50.888_524],
            [3.896_37, 50.884_193],
            [3.884_01, 50.959_292],
            [4.010_353, 51.002_522],
          ],
        ],
        type: 'Polygon' as const,
      },
      properties: {},
      type: 'Feature' as const,
    };

    const severeFeaturesWithinArea = [];
    for (const feature of severeFeatures) {
      const polygon = {
        geometry: {
          coordinates: feature.geometry.coordinates,
          type: 'MultiPolygon',
        },
        properties: {},
        type: 'Feature',
      } as const;
      const center = centroid(polygon);
      const hasIntersection = booleanPointInPolygon(center, myArea);
      if (hasIntersection) {
        severeFeaturesWithinArea.push(feature);
      }
    }

    const featureIds = new Set(severeFeaturesWithinArea.map((feature) => feature.id));

    const result = await this.prisma.client.closure.findMany({ select: { id: true } });
    for (const closure of result) {
      if (!featureIds.has(closure.id)) {
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
        if (dateInDatabase === dateOfFeature) {
          console.log('No changes detected for feature:', feature.id);
        } else {
          console.log('Update on existing closure:', feature.id);
          await this.prisma.client.closure.update({
            data: {
              description: feature.properties.HindranceDescription,
              end: feature.properties.HindranceEnd,
              geometry: JSON.stringify(feature.geometry.coordinates),
              handled: false,
              hindrance: feature.properties.Consequences,
              lastUpdate: feature.properties.HindranceLastModifiedOn,
              start: feature.properties.HindranceStart,
            },
            where: { id: feature.id },
          });
        }
      } else {
        console.log('New closure:', feature.id);
        await this.prisma.client.closure.create({
          data: {
            description: feature.properties.HindranceDescription,
            end: feature.properties.HindranceEnd,
            geometry: JSON.stringify(feature.geometry.coordinates),
            handled: false,
            hindrance: feature.properties.Consequences,
            id: feature.id,
            lastUpdate: feature.properties.HindranceLastModifiedOn,
            start: feature.properties.HindranceStart,
          },
        });
      }
    }
  }

  /**
   * Generates an array of date ranges for the next 5 days, starting from tomorrow.
   *
   * Each date range is represented as a string in the format `startDate/endDate`,
   * where `startDate` and `endDate` are ISO 8601 formatted strings representing
   * the start and end of the day respectively.
   * @returns An array of strings, where each string represents a date range for a single day.
   */
  private getDateRanges() {
    const dateRanges = [];
    const tomorrow = dayjs().add(1, 'day').startOf('day');

    for (let index = 0; index < 5; index++) {
      const start = tomorrow.add(index, 'day').startOf('day').toISOString();
      const end = tomorrow.add(index, 'day').endOf('day').toISOString();
      dateRanges.push(`${start}/${end}`);
    }

    return dateRanges;
  }
}
