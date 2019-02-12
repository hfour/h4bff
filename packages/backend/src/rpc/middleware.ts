import * as Promise from 'bluebird';
import { AppSingleton } from '@h4bff/core';
import { RPCDispatcher } from './dispatcher';

export type RPCMiddleware = (dispatcher: RPCDispatcher, next: () => Promise<any>) => Promise<any>;

/**
 * Container for RPC middlewares.
 */
export class RPCMiddlewareContainer extends AppSingleton {
  call = (dispatcher: RPCDispatcher) => {
    return Promise.resolve(dispatcher.handleRequest());
  };

  addMiddleware(middleware: RPCMiddleware) {
    let oldCall = this.call;
    this.call = (dispatcher: RPCDispatcher) => middleware.call(null, dispatcher, () => oldCall(dispatcher));
  }
}
