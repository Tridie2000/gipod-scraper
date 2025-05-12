import * as express from 'express';
import { inject } from 'inversify';
import { BaseHttpController, controller, httpGet, httpPatch, requestParam } from 'inversify-express-utils';
import * as ieu from 'inversify-express-utils';

import { ClosuresService } from '../services/closures.service';

/**
 * A controller responsible for managing closures, including retrieving all closures and toggling their handled status.
 */
@controller('/api/closures')
export class ClosuresController extends BaseHttpController {
  /**
   * Constructor for initializing the class with the provided ClosuresService dependency.
   * @param closuresService The ClosuresService instance to be injected and used within the class.
   * @returns An instance of the class.
   */
  public constructor(@inject('ClosuresService') private closuresService: ClosuresService) {
    super();
  }

  /**
   * Retrieves a list of all closures and sends them as a JSON response.
   * @param response - The HTTP response object to send the closures data.
   * @returns A promise that resolves when the closure data has been retrieved and sent as a response.
   */
  @httpGet('/')
  public async getAllClosures(@ieu.response() response: express.Response) {
    const closures = await this.closuresService.getAllClosures();
    return response.status(200).json(closures);
  }

  /**
   * Toggles the handled status of a closure specified by the provided ID.
   * @param id The unique identifier of the closure to toggle the handled status.
   * @param response The response object to send the result back to the client.
   * @returns A JSON response containing the updated state of the closure with a status code of 200.
   */
  @httpPatch('/:id/toggle')
  public async toggleHandled(@requestParam('id') id: string, @ieu.response() response: express.Response) {
    const closure = await this.closuresService.toggleHandled(id);
    return response.status(200).json(closure);
  }
}
