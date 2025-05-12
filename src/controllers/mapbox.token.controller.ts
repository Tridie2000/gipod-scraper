import { controller, httpGet, response } from 'inversify-express-utils';
import * as express from 'express';

@controller('/api/mapbox-token')
export class MapboxTokenController {
  @httpGet('/')
  public getToken(@response() res: express.Response) {
    return res.status(200).json({ token: process.env.MAPBOX_TOKEN });
  }
}
