import * as Express from 'express';
import { AppSingleton, ServiceContext, App } from '@h4bff/core';
import { RequestInfo } from './requestInfo';

/**
 * Ties each request / response pair to a specific service context.
 */
export class RequestContextProvider extends AppSingleton {
  router = Express();

  private contexts = new WeakMap<Express.Request, ServiceContext>();

  constructor(app: App) {
    super(app);
    this.router.use(this.contextualWrapper);
  }

  public getContext(req: Express.Request, res: Express.Response) {
    let result = this.contexts.get(req);
    if (!result) {
      result = this.app.createServiceContext();
      result.getService(RequestInfo)._setRequestResponse(req, res);
      this.contexts.set(req, result);
    }
    return result;
  }

  private contextualWrapper = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    this.getContext(req, res);
    next();
  };

  install(path: string, app: Express.Application) {
    app.use(path, this.router);
  }
}
