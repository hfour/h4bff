import { Request, Response } from 'express';
import { BaseService, AppSingleton, ServiceContext } from '@h4bff/core';
import { RequestContextProvider } from '../request';
import { RPCDispatcher } from '../rpc';

/**
 * RPC service middleware.
 */
export type RPCServiceMiddleware = (sCtx: ServiceContext, next: () => PromiseLike<void>) => PromiseLike<void>;

/**
 * Responsible for holding the RPC service mapping.
 */
export class RPCServiceRegistry extends AppSingleton {
  services: { [key: string]: typeof BaseService } = {};

  /**
   * Adds new RPC service mapping.
   * @param alias service alias
   * @param service service constructor
   */
  add(alias: string, service: typeof BaseService) {
    if (this.services[alias] != null) {
      throw new Error('Namespace ' + alias + ' already in use!');
    }
    this.services[alias] = service;
  }

  /**
   * Checks if a given method exists on a RPC service given by its alias.
   */
  exists(alias: string, method: string) {
    const ServiceClass = this.services[alias];
    if (!ServiceClass) {
      return false;
    }
    const serviceMethod = (ServiceClass.prototype as any)[method];
    return typeof serviceMethod === 'function';
  }

  /**
   * Returns service for given alias.
   */
  get(serviceAlias: string) {
    return this.services[serviceAlias];
  }

  /**
   * Middleware that adds RPC handling for given request and response.
   * It binds the request and response to a service context and forwards the
   * request to the {@link RPCDispatcher}.
   */
  routeHandler = (req: Request, res: Response) => {
    return this.getSingleton(RequestContextProvider).withRequestContext(req, res, ctx =>
      ctx.getService(RPCDispatcher).call(),
    );
  };
}
