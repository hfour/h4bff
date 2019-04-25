import * as Express from 'express';
import { AppSingleton, ServiceContext, App, ServiceContextEvents } from '@h4bff/core';
import { RequestInfo } from './';


type ServiceContextFn<T> = (createdContext: ServiceContext) => PromiseLike<T>;
/**
 * Use this class to open up a new service context from an express middleware. The service context
 * will provide unique instances of all service classes for that particular request.
 *
 * Also see {@link core#App.withServiceContext | App.withServiceContext} which is the more generic, non-backend-specific
 * service context.
 */
export class RequestContextProvider extends AppSingleton {
  private contexts = new WeakMap<Express.Request, ServiceContext>();

  constructor(app: App) {
    super(app);
    app.getSingleton(ServiceContextEvents).onContextDisposed((sc, _error) => {
      let req = sc.getService(RequestInfo).req;
      this.contexts.delete(req);
      return Promise.resolve();
    });
  }

  /**
   * Creates a service context for the provided Express request / response pair.
   * automatically disposes of it when the promise finishes or throws.
   *
   * Use this method to get a fresh new context directly from express middleware. You don't need
   * this method from within RPC methods in services, as a context is automatically created for
   * them.
   *
   * @param req - An Express Request
   * @param res - An Express Response
   * @param f - A function that receives the service context as an argument. This function will be called when the context is allocated. When the returned promise gets fulfilled or rejected, the context will be automatically disposed, closing any services that allocate resources, such as for example database transactions. The result of the outer promise (a value or an error) will be the same as the result of the inner promise.
   *
   * @example
   * ```typescript
   * router.get('/db-healthcheck', (req, res) => {
   *   app.getSingleton(RequestContextProvider).withRequestContext(req, res, ctx => {
   *     return ctx.getService(TransactionProvider).queryAsync('SELECT 1')
   *      .then(() => res.end('OK'), err => res.end('ERROR'))
   *   })
   * })
   * ```
   */
  withRequestContext<T>(
    req: Express.Request,
    res: Express.Response,
    f: ServiceContextFn<T>
  ): PromiseLike<T> {
    return this.app.withServiceContext(ctx => {
      ctx.getService(RequestInfo)._setRequestResponse(req, res);
      return f(ctx);
    });
  }
}
