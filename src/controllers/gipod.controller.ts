import { inject } from 'inversify';
import { BaseHttpController, controller } from 'inversify-express-utils';
import { GiPodService } from '../services/gipod.service';

@controller('/')
export class GiPodController extends BaseHttpController {
  constructor(@inject('GiPodService') private readonly gipodService: GiPodService) {
    super();
    this.gipodService.listen();
  }
}
