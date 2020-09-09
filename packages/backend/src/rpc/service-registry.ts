import { BaseService, AppSingleton, ServiceContext } from '@h4bff/core';
import { JSONRPCExpress } from './jsonrpc-express';

/**
 * RPC service middleware.
 */
export type RPCServiceMiddleware = (
  sCtx: ServiceContext,
  next: () => PromiseLike<void>,
) => PromiseLike<void>;

/**
 * Responsible for holding the RPC service mapping.
 */
export class RPCServiceRegistry extends AppSingleton {
  services: { [key: string]: typeof BaseService } = {};

  /**
   * Adds new RPC service mapping.
   * @param alias - service alias
   * @param service - service constructor
   */
  add(alias: string, service: typeof BaseService) {
    if (this.services[alias] != null) {
      throw new Error('Namespace ' + alias + ' already in use!');
    }
    this.services[alias] = service;
  }

  /**
   * Returns service for given alias.
   */
  get(serviceAlias: string): typeof BaseService | undefined {
    return this.services[serviceAlias];
  }

  /**
   * @deprecated: Use JSONRRPCExpress.routeHandler instead
   */
  routeHandler = this.getSingleton(JSONRPCExpress).routeHandler;
}
