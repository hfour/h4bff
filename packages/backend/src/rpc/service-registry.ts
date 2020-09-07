import { Request, Response } from 'express';
import { BaseService, AppSingleton, ServiceContext } from '@h4bff/core';
import { RequestContextProvider } from '../request';
import { RPCDispatcher, isCustomResponse, RPCErrorHandlers } from '../rpc';

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

  private jsonFail(res: Response, code: number, message: string, data: any = null) {
    return res.status(code).json({
      code,
      result: data,
      error: {
        code,
        message,
      },
      version: 2,
      backendError: true,
    });
  }

  private fail = (res: Response, e: Error) => {
    let errorResponse = this.getSingleton(RPCErrorHandlers).handle(e);

    if (errorResponse) {
      return this.jsonFail(res, errorResponse.code, errorResponse.message, errorResponse.data);
    }

    if (typeof (e as any).code === 'number') {
      return this.jsonFail(res, (e as any).code, e.message);
    }

    console.error(e);
    return this.jsonFail(res, 500, 'An unexpected error occurred. Please try again.');
  };

  private success = (res: Response, data: any, code: number = 200) => {
    if (isCustomResponse(data)) {
      return data.sendToHTTPResponse(res, code);
    } else {
      return res.status(code).json({
        code,
        result: data,
        error: null,
        version: 2,
      });
    }
  };

  /**
   * Middleware that adds RPC handling for given request and response.
   * It binds the request and response to a service context and forwards the
   * request to the {@link RPCDispatcher}.
   */
  routeHandler = (req: Request, res: Response) => {
    return this.getSingleton(RequestContextProvider)
      .withRequestContext(req, res, ctx => ctx.getService(RPCDispatcher).call())
      .then(data => this.success(res, data, 200), err => this.fail(res, err));
  };
}
