import * as Promise from 'bluebird';
import { BaseService } from '@h4bff/core';
import { RPCServiceRegistry } from './service-registry';
import { RequestInfo } from '../request';
import { RPCMiddlewareContainer } from './middleware';
import { RPCErrorHandlers } from './error-handler';

export class CodedError extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
}

export interface DispatchInfo {
  service: string | null;
  method: string | null;
  params: unknown;
}
/**
 * Responsible for controlling the entire RPC lifecycle, including middleware and method calls.
 * to the correct RPC mapping as found in the {@link RPCServiceRegistry}.
 */
export class RPCDispatcher extends BaseService {
  private dispatchInfo: () => DispatchInfo = () => {
    throw new Error('RPC Dispatch info not provided!');
  };

  /**
   * You can use this method to implement a different dispatch mechanism other than JSON RPC. As
   * long as you can provide the necessary dispatch info - service name, method and params - it
   * should be possible to implement any HTTP based dispatch, like REST
   *
   * @internal
   */
  public withDispatchInfo(di: () => DispatchInfo) {
    this.dispatchInfo = di;
    return this;
  }

  get res() {
    return this.getService(RequestInfo).res;
  }

  get req() {
    return this.getService(RequestInfo).req;
  }

  get rpcRegistry() {
    return this.getSingleton(RPCServiceRegistry);
  }

  get serviceClass() {
    const { service } = this.dispatchInfo();
    if (!service) return null;
    return this.rpcRegistry.get(service);
  }

  get serviceInstance() {
    return this.serviceClass && this.getService(this.serviceClass);
  }

  get serviceMethod() {
    const { method } = this.dispatchInfo();
    if (!method) return null;
    return this.serviceInstance && ((this.serviceInstance as any)[method] as Function);
  }

  /**
   * Executes the genuine RPC method.
   */
  handleRequest() {
    let info = this.dispatchInfo();

    if (!info.method || !info.service) {
      throw new CodedError(400, '"method" query parameter not found');
    }
    if (!info.params) {
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
      () => this.serviceMethod!.call(this.serviceInstance, info.params),
    );
  }

  /**
   * Executes the RPC middleware chain including the genuine RPC call.
   * Handles both, success and error cases.
   */
  call = () => {
    return this.getSingleton(RPCMiddlewareContainer)
      .call(this)
      .catch(e => {
        let customHandlerError = this.getSingleton(RPCErrorHandlers).handle(e);
        if (customHandlerError) throw customHandlerError;
        throw e;
      });
  };
}
