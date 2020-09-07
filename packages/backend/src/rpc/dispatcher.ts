import * as Promise from 'bluebird';
import { BaseService } from '@h4bff/core';
import { RPCServiceRegistry } from './service-registry';
import { RequestInfo } from '../request';
import { RPCMiddlewareContainer } from './middleware';
import { isCustomResponse } from './response';
import { RPCErrorHandlers } from './error-handler';

export class CodedError extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
}

/**
 * Responsible for finding and executing the right RPC method based on the RPC mapping found in the {@link RPCServiceRegistry}.
 */
export class RPCDispatcher extends BaseService {
  get res() {
    return this.getService(RequestInfo).res;
  }

  get req() {
    return this.getService(RequestInfo).req;
  }

  get rpcPath(): string {
    return this.req.query.method;
  }

  get rpcRegistry() {
    return this.getSingleton(RPCServiceRegistry);
  }

  /**
   * When given 'serviceAlias.method' string, it splits it to ['serviceAlias', 'method'].
   *
   * If the string has more than one dot, the serviceAlias consumes all parts of the name
   * except for the last one:
   *
   * 'path.with.more.dots' =\> ['path.with.more', 'dots']
   */
  get serviceNameMethod() {
    const lastDotIndex = this.rpcPath.lastIndexOf('.');
    return [this.rpcPath.slice(0, lastDotIndex), this.rpcPath.slice(lastDotIndex + 1)];
  }

  get serviceClass() {
    const [serviceAlias] = this.serviceNameMethod;
    return this.rpcRegistry.get(serviceAlias);
  }

  get serviceInstance() {
    return this.serviceClass && this.getService(this.serviceClass);
  }

  get serviceMethod() {
    const method = this.serviceNameMethod[1];
    return this.serviceInstance && ((this.serviceInstance as any)[method] as Function);
  }

  /**
   * Executes the genuine RPC method.
   */
  handleRequest() {
    let { req } = this;

    if (!req.query.method) {
      throw new CodedError(400, '"method" query parameter not found');
    }
    if (!req.body.params) {
      throw new CodedError(
        400,
        '"params" not found, send an empty object in case of no parameters',
      );
    }
    if (this.serviceMethod == null) {
      throw new CodedError(404, 'Method not found');
    }

    // in case the method fails, we want the error to bubble up
    return Promise.resolve().then(
      // We already did the existence check above
      () => this.serviceMethod!.call(this.serviceInstance, req.body.params),
    );
  }

  /**
   * Executes the RPC middleware chain including the genuine RPC call.
   * Handles both, success and error cases.
   */
  call = () => {
    return this.getSingleton(RPCMiddlewareContainer).call(this);
  };
}
