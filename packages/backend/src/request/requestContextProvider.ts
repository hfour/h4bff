import * as Express from 'express';
import { AppSingleton, ServiceContext } from '@h4bff/core';
import { RequestInfo } from './';

/**
 * Keeps a map of request / response pairs tied to their
 * given service context.
 */
export class RequestContextProvider extends AppSingleton {
  private contexts = new WeakMap<Express.Request, ServiceContext>();

  /**
   * Creates a new service context and sets the req / res pair,
   * unless there's already one, in which case it's returned instead.
   */
  getContext(req: Express.Request, res: Express.Response) {
    let result = this.contexts.get(req);
    if (!result) {
      result = this.app.createServiceContext();
      result.getService(RequestInfo)._setRequestResponse(req, res);
      this.contexts.set(req, result);
    }
    return result;
  }

  /**
   * Creates a service context for the provided req / res pair and
   * automatically disposes of it when the promise finishes or throws.
   */
  withRequestContext<T>(
    req: Express.Request,
    res: Express.Response,
    f: (createdContext: ServiceContext) => PromiseLike<T>,
  ): PromiseLike<T> {
    return this.app.withServiceContext(ctx => {
      ctx.getService(RequestInfo)._setRequestResponse(req, res);
      return f(ctx);
    });
  }
}
