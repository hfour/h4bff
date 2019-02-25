import { Request, Response } from 'express';
import { BaseService } from '@h4bff/core';

/**
 * Keeps a request/response pair from Express, exactly
 * once per service request.
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
