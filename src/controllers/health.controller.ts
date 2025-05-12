import { BaseHttpController, controller, httpGet, response } from 'inversify-express-utils';
import * as express from 'express';
import { inject } from 'inversify';
import { ClosuresImportService } from '../services/closures.import.service';
import { CronJob } from 'cron';

@controller('/health')
export class HealthController extends BaseHttpController {
  @httpGet('/')
  public index(@response() res: express.Response) {
    return res.sendStatus(200);
  }
}

@controller('/')
export class RootController extends HealthController {
  public constructor(@inject('ClosuresImportService') private closuresImportService: ClosuresImportService) {
    super();
    this.importClosures();
    CronJob.from({
      cronTime: '15 14 * * *',
      start: true,
      onTick: () => {
        this.importClosures();
      },
    });
  }

  private importClosures() {
    this.closuresImportService
      .import()
      .then(() => console.log('New closures imported.'))
      .catch(console.error);
  }
}
