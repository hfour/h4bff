import * as bodyParser from 'body-parser';
import * as Promise from 'bluebird';
import { Request, Response } from 'express';
import { App, BaseService, AppSingleton } from '@h4bff/core';
import { ContextualWrapper } from '../router';
import { RPCDispatcher } from '../rpc';

export class RPCServiceRegistry extends AppSingleton {
  private router = this.app.getSingleton(ContextualWrapper).router;
  services: { [key: string]: typeof BaseService } = {};

  constructor(app: App) {
    super(app);
    this.router.post('/rpc', bodyParser.json(), this.routeHandler.bind(this));
  }

  add(namespace: string, svc: typeof BaseService) {
    if (this.services[namespace] != null) {
      throw new Error('Namespace ' + namespace + ' already in use!');
    }
    this.services[namespace] = svc;
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

  routeHandler(req: Request, res: Response): void | Promise<void> {
    let dispatcher = this.getSingleton(ContextualWrapper)
      .getContext(req, res)
      .getService(RPCDispatcher);
    return dispatcher.call();
  }
}
