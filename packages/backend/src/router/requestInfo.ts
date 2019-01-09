import * as Express from 'express';
import { BaseService } from 'core';

export class RequestInfo extends BaseService {
  req!: Express.Request;
  res!: Express.Response;

  /**
   * @internal
   */
  _setRequestResponse(req: Express.Request, res: Express.Response) {
    this.req = req;
    this.res = res;
  }
}
