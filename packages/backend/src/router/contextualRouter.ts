import * as Express from 'express';
import { AppSingleton, ServiceContext } from 'core';
import { RequestInfo } from './requestInfo';

export class ContextualRouter extends AppSingleton {
  private router = Express();

  private contexts = new WeakMap<Express.Request, ServiceContext>();

  public getContext(req: Express.Request, res: Express.Response) {
    let result = this.contexts.get(req);
    if (!result) {
      result = this.app.createServiceContext();
      result.getService(RequestInfo)._setRequestResponse(req, res);
      this.contexts.set(req, result);
    }
    return result;
  }

  contextualWrapper = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    this.getContext(req, res);
    next();
  };

  post(url: string, ...middlewares: Express.RequestHandler[]) {
    return this.router.post(url, this.contextualWrapper, ...middlewares);
  }

  get(url: string, ...middlewares: Express.RequestHandler[]) {
    return this.router.get(url, this.contextualWrapper, ...middlewares);
  }

  use(url: string, ...middlewares: Express.RequestHandler[]) {
    return this.router.use(url, this.contextualWrapper, ...middlewares);
  }

  install(path: string, app: Express.Application) {
    app.use(path, this.router);
  }
}
