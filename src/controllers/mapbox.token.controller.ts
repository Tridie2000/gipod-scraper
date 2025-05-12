import * as express from 'express';
import { controller, httpGet } from 'inversify-express-utils';
import * as ieu from 'inversify-express-utils';

/**
 * Controller for handling Mapbox token-related endpoints.
 */
@controller('/api/mapbox-token')
export class MapboxTokenController {
  /**
   * Handles HTTP GET requests to retrieve a token.
   * @param response The HTTP response object used to send the token as a JSON response.
   * @returns The response containing the token in JSON format.
   */
  @httpGet('/')
  public getToken(@ieu.response() response: express.Response) {
    return response.status(200).json({ token: process.env.MAPBOX_TOKEN });
  }
}
