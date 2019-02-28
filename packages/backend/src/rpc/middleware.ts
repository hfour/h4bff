import * as Promise from 'bluebird';
import { AppSingleton } from '@h4bff/core';
import { RPCDispatcher } from './dispatcher';

export type RPCMiddleware = (dispatcher: RPCDispatcher, next: () => Promise<any>) => Promise<any>;

/**
 * Container for RPC middlewares.
 */
export class RPCMiddlewareContainer extends AppSingleton {
  call = (dispatcher: RPCDispatcher) => {
    return Promise.resolve().then(() => dispatcher.handleRequest());
  };

  /**
   * Adds new middleware to the RPC layer. Make sure that a middleware always returns a result.
   * It might be a result that the middleware generates or modifies from the previos middleware,
   * or it could be the result of the "next()" middleware. This way the result will be cascaded
   * to the end of the middleware chain to achieve consistent success and error handling.
   */
  addMiddleware(middleware: RPCMiddleware) {
    let oldCall = this.call;
    this.call = (dispatcher: RPCDispatcher) => {
      try {
        return middleware.call(null, dispatcher, () => oldCall(dispatcher));
      } catch (e) {
        return Promise.reject(e);
      }
    };
  }
}
