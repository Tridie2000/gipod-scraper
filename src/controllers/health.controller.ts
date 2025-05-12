import { CronJob } from 'cron';
import * as express from 'express';
import { inject } from 'inversify';
import { BaseHttpController, controller, httpGet } from 'inversify-express-utils';
import * as ieu from 'inversify-express-utils';

import { ClosuresImportService } from '../services/closures.import.service';

/**
 * Controller responsible for handling health-related HTTP requests.
 * Extends the `BaseHttpController` to inherit common HTTP functionality.
 */
@controller('/health')
export class HealthController extends BaseHttpController {
  /**
   * Handles HTTP GET requests to the root endpoint '/'.
   * @param response The HTTP response object to send the status code.
   * @returns HTTP status code 200 indicating a successful response.
   */
  @httpGet('/')
  public index(@ieu.response() response: express.Response) {
    return response.sendStatus(200);
  }
}

/**
 * The RootController is a controller class for the root route of the application.
 * It extends the HealthController and is responsible for managing closures import via
 * the ClosuresImportService and scheduled cron jobs.
 *
 * This controller initializes the ClosuresImportService and sets up a daily cron job
 * to automatically import closures.
 */
@controller('/')
export class RootController extends HealthController {
  /**
   * Constructs an instance of the class and initializes the scheduled cron job for importing closures.
   * @param closuresImportService Injects the ClosuresImportService to handle the import logic.
   * @returns A new instance of the class with the cron job set up to periodically execute the importClosures method.
   */
  public constructor(@inject('ClosuresImportService') private closuresImportService: ClosuresImportService) {
    super();
    this.importClosures();
    CronJob.from({
      cronTime: '15 14 * * *',
      onTick: () => {
        this.importClosures();
      },
      start: true,
    });
  }

  /**
   * Imports new closures using the closuresImportService and handles the results.
   * Logs a confirmation message upon successful import and outputs errors if any occur.
   */
  private importClosures() {
    this.closuresImportService
      .import()
      .then(() => console.log('New closures imported.'))
      .catch(console.error);
  }
}
