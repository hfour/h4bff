import * as Promise from 'bluebird';
import { BaseService } from '@h4bff/core';
import { RPCServiceRegistry } from './service-registry';
import { RequestInfo } from '../request';
import { RPCMiddlewareContainer } from './middleware';
import { isCustomResponse } from './response';
import { RPCErrorHandlers } from './error-handler';

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

  private jsonFail(code: number, message: string, data: any = null) {
    return this.res.status(code).json({
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

  private fail = (e: Error) => {
    let errorResponse = this.getSingleton(RPCErrorHandlers).handle(e);

    if (errorResponse) {
      return this.jsonFail(errorResponse.code, errorResponse.message, errorResponse.data);
    }

    if (typeof (e as any).code === 'number') {
      return this.jsonFail((e as any).code, e.message);
    }

    console.error(e);
    return this.jsonFail(500, 'An unexpected error occurred. Please try again.');
  };

  private success = (data: any, code: number = 200) => {
    if (isCustomResponse(data)) {
      return data.sendToHTTPResponse(this.res, code);
    } else {
      return this.res.status(code).json({
        code,
        result: data,
        error: null,
        version: 2,
      });
    }
  };

  /**
   * Executes the genuine RPC method.
   */
  handleRequest() {
    let { req } = this;

    if (!req.query.method) {
      return this.jsonFail(400, '"method" query parameter not found');
    }
    if (!req.body.params) {
      return this.jsonFail(
        400,
        '"params" not found, send an empty object in case of no parameters',
      );
    }
    if (this.serviceMethod == null) {
      return this.jsonFail(404, 'Method not found');
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
    return this.getSingleton(RPCMiddlewareContainer)
      .call(this)
      .then(this.success, err => {
        this.fail(err);
        throw err;
      });
  };
}
