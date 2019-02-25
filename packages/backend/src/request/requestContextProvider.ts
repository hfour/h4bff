import * as Express from 'express';
import { AppSingleton, ServiceContext } from '@h4bff/core';
import { RequestInfo } from './';

/**
 * Ties each provided request / response pair to a specific service context.
 */
export class RequestContextProvider extends AppSingleton {
  private contexts = new WeakMap<Express.Request, ServiceContext>();

  /**
   * Returns the context bound to the provided request object.
   * If it doesn't exists, it creates a new context and return.
   */
  public getContext(req: Express.Request, res: Express.Response) {
    let result = this.contexts.get(req);
    if (!result) {
      result = this.app.createServiceContext();
      result.getService(RequestInfo)._setRequestResponse(req, res);
      this.contexts.set(req, result);
    }
    return result;
  }

  /**
   * Creates a service context for the provided request / response pair and
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
