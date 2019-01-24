import * as Promise from 'bluebird';
import { BaseService } from '@h4bff/core';
import { RPCServiceRegistry } from './serviceRegistry';
import { RPCEvents } from './events';
import { RequestInfo } from '../router';

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

  private jsonFail(code: number, message: string, data: any = null) {
    this.res.status(code).json({
      code,
      result: data,
      error: {
        code,
        message,
      },
      version: 2,
    });
  }

  private fail(e: Error) {
    // TODO emit fail, for e.g. audit logger, instead of locator onDispose
    // this.app.getSingleton(RPCEvents).emit('fail', ...)

    this.getSingleton(RPCEvents)
      .requestComplete(this, e)
      .then(() => {
        if (typeof (e as any).code === 'number') {
          return this.jsonFail((e as any).code, e.message);
        } else if ((e as any).isJoi) {
          console.error(`Validation failed for "${this.rpcPath}":`);
          (e as any).details.forEach((err: any) => console.error(` \-> ${err.message}`));
          return this.jsonFail(400, 'Technical error, the request was malformed.');
        } else {
          console.error(e);
          return this.jsonFail(500, 'Something bad happened.');
        }
      });
  }

  private success(data: any, code: number = 200) {
    // TODO emit success, for e.g. audit logger, instead of locator onDispose
    // this.app.getSingleton(RPCEvents).emit('success', ...)
    console.log('success');
    this.getSingleton(RPCEvents)
      .requestComplete(this, null)
      .then(() => {
        this.res.status(code).json({
          code,
          result: data,
          error: null,
          version: 2,
        });
      });
  }

  /**
   * When given 'serviceAlias.method' string, it splits it to ['serviceAlias', 'method'].
   *
   * If the string has more than one dot, the serviceAlias consumes all parts of the name
   * except for the last one:
   *
   * 'path.with.more.dots' => ['path.with.more', 'dots']
   */
  private getServiceNameMethod(s: string): [string, string] {
    const lastDotIndex = s.lastIndexOf('.');
    return [s.slice(0, lastDotIndex), s.slice(lastDotIndex + 1)];
  }

  call() {
    let { req } = this;
    console.log('calling', req.query.method);

    if (!req.query.method) {
      return this.jsonFail(400, '"method" query parameter not found');
    }
    if (!req.body.params) {
      return this.jsonFail(400, '"params" not found, send an empty object in case of no parameters');
    }

    const [serviceAlias, method] = this.getServiceNameMethod(req.query.method);

    if (!this.rpcRegistry.exists(serviceAlias, method)) {
      return this.jsonFail(404, 'Method not found');
    }

    const ServiceClass = this.rpcRegistry.get(serviceAlias);

    const serviceInstance = this.getService(ServiceClass);
    const serviceMethod = (serviceInstance as any)[method] as Function;

    // in case the method is not a promise, we don't want the error to bubble-up
    const promiseWrapper = Promise.resolve();
    return promiseWrapper
      .then(() => serviceMethod.call(serviceInstance, req.body.params) as Promise<any>)
      .then(result => this.success(result), error => this.fail(error));
  }
}