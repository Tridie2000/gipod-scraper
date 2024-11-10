import { BaseHttpController, controller, httpGet, response } from 'inversify-express-utils';
import * as express from 'express';

@controller('/health')
export class HealthController extends BaseHttpController {
  @httpGet('/')
  public index(@response() res: express.Response) {
    return res.sendStatus(200);
  }
}
