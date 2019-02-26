import * as Express from 'express';
import { AppSingleton, ServiceContext, App, ServiceContextEvents } from '@h4bff/core';
import { RequestInfo } from './';

/**
 * Ties each provided request / response pair to a specific service context.
 */
export class RequestContextProvider extends AppSingleton {
  private contexts = new WeakMap<Express.Request, ServiceContext>();

  constructor(app: App) {
    super(app);
    app.getSingleton(ServiceContextEvents).onContextDisposed((sc, _error) => {
      return this.onDispose(sc);
    });
  }

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
   * Gets called on context disposal and makes sure that the service context
   * gets removed from the contexts map.
   */
  private onDispose(sc: ServiceContext) {
    let req = sc.getService(RequestInfo).req;
    this.contexts.delete(req);
    return Promise.resolve();
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
