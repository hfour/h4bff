import { AppSingleton } from '@h4bff/core';
import { ErrorResponse } from './error-handler';
import { isCustomResponse } from './response';
import { Response, Request } from 'express';
import { RequestContextProvider } from '../request';
import { RPCDispatcher } from './dispatcher';

export class JSONRPCExpress extends AppSingleton {
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

  private fail = (res: Response, e: Error | ErrorResponse) => {
    console.log('Called fail with', e);
    if (e != null && 'data' in e) {
      return this.jsonFail(res, e.code, e.message, e.data);
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
