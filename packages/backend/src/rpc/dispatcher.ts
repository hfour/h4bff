import * as Promise from 'bluebird';
import { BaseService, ServiceContextEvents } from '@h4bff/core';
import { RPCServiceRegistry } from './serviceRegistry';
import { RequestInfo } from '../request';
import { RPCMiddlewareContainer } from './middleware';
import { isCustomResponse } from './response';

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
   * 'path.with.more.dots' => ['path.with.more', 'dots']
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
    return this.getService(this.serviceClass);
  }

  get serviceMethod() {
    const method = this.serviceNameMethod[1];
    return (this.serviceInstance as any)[method] as Function;
  }

  private jsonFail(code: number, message: string, data: any = null) {
    this.res.status(code).json({
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
    this.getSingleton(ServiceContextEvents)
      .disposeContext(this.context, e)
      .then(() => {
        if (typeof (e as any).code === 'number') {
          return this.jsonFail((e as any).code, e.message);
        } else if ((e as any).isJoi) {
          // TODO: Joi specific handling, get rid of it
          console.error(`Validation failed for "${this.rpcPath}":`);
          (e as any).details.forEach((err: any) => console.error(` \-> ${err.message}`));
          return this.jsonFail(400, 'Technical error, the request was malformed.');
        } else {
          console.error(e);
          return this.jsonFail(500, 'Something bad happened.');
        }
      });
  };

  private success = (data: any, code: number = 200) => {
    this.getSingleton(ServiceContextEvents)
      .disposeContext(this.context, null)
      .then(() => {
        if (isCustomResponse(data)) {
          data.sendToHTTPResponse(this.res, code);
        } else {
          this.res.status(code).json({
            code,
            result: data,
            error: null,
            version: 2,
          });
        }
      });
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
      return this.jsonFail(400, '"params" not found, send an empty object in case of no parameters');
    }

    const [serviceAlias, method] = this.serviceNameMethod;

    if (!this.rpcRegistry.exists(serviceAlias, method)) {
      return this.jsonFail(404, 'Method not found');
    }

    // in case the method is not a promise, we don't want the error to bubble-up
    const promiseWrapper = Promise.resolve();
    return promiseWrapper.then(() => this.serviceMethod.call(this.serviceInstance, req.body.params) as Promise<any>);
  }

  /**
   * Executes the RPC middleware chain including the genuine RPC call.
   * Handles both, success and error cases.
   */
  call = () => {
    return this.getSingleton(RPCMiddlewareContainer)
      .call(this)
      .then(this.success, this.fail);
  };
}
