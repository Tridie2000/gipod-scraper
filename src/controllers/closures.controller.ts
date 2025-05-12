import { BaseHttpController, controller, httpGet, httpPatch, requestParam, response } from 'inversify-express-utils';
import * as express from 'express';
import { ClosuresService } from '../services/closures.service';
import { inject } from 'inversify';

@controller('/api/closures')
export class ClosuresController extends BaseHttpController {
  public constructor(@inject('ClosuresService') private closuresService: ClosuresService) {
    super();
  }

  @httpGet('/')
  public async getAllClosures(@response() res: express.Response) {
    const closures = await this.closuresService.getAllClosures();
    return res.status(200).json(closures);
  }

  @httpPatch('/:id/toggle')
  public async toggleHandled(@requestParam('id') id: string, @response() res: express.Response) {
    const closure = await this.closuresService.toggleHandled(id);
    return res.status(200).json(closure);
  }
}
