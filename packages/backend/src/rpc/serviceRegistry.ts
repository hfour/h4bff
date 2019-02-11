import * as Promise from 'bluebird';
import * as composeMiddlewares from 'koa-compose';
import { Request, Response } from 'express';
import { App, BaseService, AppSingleton, ServiceContext } from '@h4bff/core';
import { RequestContextProvider } from '../router';
import { RPCDispatcher } from '../rpc';

export type RPCServiceMiddleware = (sCtx: ServiceContext, next: () => PromiseLike<void>) => PromiseLike<void>;

export class RPCServiceRegistry extends AppSingleton {
  services: { [key: string]: typeof BaseService } = {};
  middlewares: RPCServiceMiddleware[] = [];
  middlewareChain: composeMiddlewares.ComposedMiddleware<ServiceContext> | null = null;

  constructor(app: App) {
    super(app);
  }

  add(namespace: string, svc: typeof BaseService) {
    if (this.services[namespace] != null) {
      throw new Error('Namespace ' + namespace + ' already in use!');
    }
    this.services[namespace] = svc;
  }

  addMiddleware(middleware: RPCServiceMiddleware) {
    this.middlewares.push(middleware);
    this.middlewareChain = composeMiddlewares(this.middlewares);
  }

  exists(serviceAlias: string, method: string) {
    const ServiceClass = this.services[serviceAlias];
    if (!ServiceClass) {
      return false;
    }
    const serviceMethod = (ServiceClass.prototype as any)[method];
    return typeof serviceMethod === 'function'; // && serviceMethod.__exposed;
  }

  get(serviceAlias: string) {
    return this.services[serviceAlias];
  }

  routeHandler = (req: Request, res: Response): void | Promise<void> => {
    let dispatcher = this.getSingleton(RequestContextProvider)
      .getContext(req, res)
      .getService(RPCDispatcher);
    return dispatcher.call();
  };
}
