import { Request, Response } from 'express';
import { BaseService } from '@h4bff/core';

/**
 * Stores the current express Request and Response objects.
 */
export class RequestInfo extends BaseService {
  req!: Request;
  res!: Response;

  /**
   * @internal
   */
  _setRequestResponse(req: Request, res: Response) {
    this.req = req;
    this.res = res;
  }
}
