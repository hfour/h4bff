import * as Promise from 'bluebird';
import { App, BaseService, ServiceContextEvents } from '@h4bff/core';
import { Request, Response, response } from 'express';
import { RequestInfo } from '../request';
import { RPCDispatcher } from './dispatcher';
import { RPCServiceRegistry } from './service-registry';
import { RPCMiddlewareContainer } from './middleware';
import { RPCErrorHandlers } from '.';
import { JSONRPCExpress } from './jsonrpc-express';

function mockRequest(method?: string, params?: any) {
  const req = {} as Request;
  req.query = { method };
  req.body = { params };
  return req;
}

function mockResponse() {
  const res = {} as Response;
  res.status = jest.fn(() => res);
  res.json = jest.fn();
  return res;
}

function runMock(
  app: App,
  opts: { method?: string; params?: any; response?: (params: unknown) => any },
) {
  let sendResponse = opts.response || (() => 'Hello World');
  let mReq = mockRequest(opts.method, opts.params);
  let mRes = mockResponse();

  app.overrideService(
    RequestInfo,
    class MockRequestInfo extends RequestInfo {
      req = mReq;
      res = mRes;
    },
  );

  // mock disposeContext call
  app.overrideSingleton(
    ServiceContextEvents,
    class MockServiceContextEvents extends ServiceContextEvents {
      disposeContext = jest.fn(() => Promise.resolve());
    },
  );

  app.getSingleton(RPCServiceRegistry).add(
    'test',
    class TestService extends BaseService {
      method(params: unknown) {
        return sendResponse(params);
      }
    },
  );

  return app
    .getSingleton(JSONRPCExpress)
    .routeHandler(mReq, mRes)
    .then(() => ({ req: mReq, res: mRes }));
}

describe('RPCDispatcher', () => {
  describe('handleRequest', () => {
    it(`should respond with error if method is not found in the request query params`, async () => {
      let { res } = await runMock(new App(), {});
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        code: 400,
        result: null,
        error: {
          code: 400,
          message: '"method" query parameter not found',
        },
        version: 2,
        backendError: true,
      });
    });

    it(`should respond with error if body params are not found in the request`, async () => {
      let { res } = await runMock(new App(), { method: 'test.method' });

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        code: 400,
        result: null,
        error: {
          code: 400,
          message: '"params" not found, send an empty object in case of no parameters',
        },
        version: 2,
        backendError: true,
      });
    });

    it(`should respond with error if method doesn't exist on the service`, async () => {
      let requestInfo = await runMock(new App(), { method: 'test.notMethod', params: {} });

      expect(requestInfo.res.status).toHaveBeenCalledWith(404);
      expect(requestInfo.res.json).toHaveBeenCalledWith({
        code: 404,
        result: null,
        error: {
          code: 404,
          message: 'Method not found',
        },
        version: 2,
        backendError: true,
      });
    });
  });

  describe('RPC call execution', () => {
    it('should respond with success and dispose context in normal circumstances', async () => {
      let app = new App();

      let requestInfo = await runMock(app, {
        method: 'test.method',
        params: {},
        response: () => 'data',
      });
      expect(requestInfo.res.json).toHaveBeenCalledWith({
        code: 200,
        result: 'data',
        error: null,
        version: 2,
      });
      expect(requestInfo.res.status).toHaveBeenCalledWith(200);

      expect(app.getSingleton(ServiceContextEvents).disposeContext).toHaveBeenCalled();
    });

    it('should respond with custom success response and dispose context for specific results', async () => {
      let app = new App();

      // mock middleware call and prepare custom response
      let mockData = {
        sendToHTTPResponse: jest.fn(() => Promise.resolve('test')),
      };

      let requestInfo = await runMock(app, {
        method: 'test.method',
        params: {},
        response: () => mockData,
      });
      expect(mockData.sendToHTTPResponse).toHaveBeenCalledWith(requestInfo.res, 200);
      expect(app.getSingleton(ServiceContextEvents).disposeContext).toHaveBeenCalled();
    });

    it('should respond with error response when the RPC call fails', async () => {
      let app = new App();

      let requestInfo = await runMock(app, {
        method: 'test.method',
        params: {},
        response: () => Promise.reject({ code: 403, message: 'error' }),
      });

      expect(requestInfo.res.status).toHaveBeenCalledWith(403);
      expect(requestInfo.res.json).toHaveBeenCalledWith({
        code: 403,
        result: null,
        error: {
          code: 403,
          message: 'error',
        },
        version: 2,
        backendError: true,
      });

      expect(app.getSingleton(ServiceContextEvents).disposeContext).toHaveBeenCalled();
    });

    it('should respond with error response from a registered error handler when the RPC call fails with error the handler can handle', async () => {
      let app = new App();

      // create dummy handler to ensure the correct handler can be reached
      let dummyHandler = jest.fn((_e: Error) => undefined);

      // create custom handler that we expect to be reached
      let specificHandler = jest.fn((e: Error) => {
        if ((e as any).isJoi) {
          return {
            code: 400,
            message: 'Technical error, the request was malformed.',
            data: (e as any).details,
          };
        }
      });

      // register the handlers in order
      app.getSingleton(RPCErrorHandlers).addErrorHandler(dummyHandler);
      app.getSingleton(RPCErrorHandlers).addErrorHandler(specificHandler);

      let requestInfo = await runMock(app, {
        method: 'test.method',
        params: {},
        response: () => Promise.reject({ isJoi: true, details: 'Error details' }),
      });
      // expect(err).toEqual(
      // expect.objectContaining({ isJoi: true, details: 'Error details' }),
      // );
      expect(requestInfo.res.status).toHaveBeenCalledWith(400);
      expect(requestInfo.res.json).toHaveBeenCalledWith({
        code: 400,
        result: 'Error details',
        error: {
          code: 400,
          message: 'Technical error, the request was malformed.',
        },
        version: 2,
        backendError: true,
      });

      expect(dummyHandler).not.toHaveBeenCalled();
      expect(specificHandler).toHaveBeenCalledTimes(1);
      expect(app.getSingleton(ServiceContextEvents).disposeContext).toHaveBeenCalled();
    });

    it('should respond with error response from the last registered error handler when the RPC call fails with error that the handler can handle', async () => {
      let app = new App();

      // create handler that can handle the error but cannot be reached? reached
      let specificHandler1 = jest.fn((e: Error) => {
        if ((e as any).isJoi) {
          return {
            code: 400,
            message: 'Technical error, the request was malformed.',
            data: (e as any).details,
          };
        }
      });

      // create third handler with same condition as the previous to ensure it was not reached
      let specificHandler2 = jest.fn((e: Error) => {
        if ((e as any).isJoi) {
          return {
            code: 444,
            message: 'I am the most recently registered handler and I am handling the error.',
            data: (e as any).details,
          };
        }
      });

      // register the handlers in order
      app.getSingleton(RPCErrorHandlers).addErrorHandler(specificHandler1);
      app.getSingleton(RPCErrorHandlers).addErrorHandler(specificHandler2);

      let requestInfo = await runMock(app, {
        method: 'test.method',
        params: {},
        response: () => Promise.reject({ isJoi: true, details: 'Error details' }),
      });
      // expect(err).toEqual(
      //   expect.objectContaining({ isJoi: true, details: 'Error details' }),
      // );
      expect(requestInfo.res.status).toHaveBeenCalledWith(444);
      expect(requestInfo.res.json).toHaveBeenCalledWith({
        code: 444,
        result: 'Error details',
        error: {
          code: 444,
          message: 'I am the most recently registered handler and I am handling the error.',
        },
        version: 2,
        backendError: true,
      });
      expect(specificHandler1).not.toHaveBeenCalledWith();
      expect(specificHandler2).toHaveBeenCalledTimes(1);
      expect(app.getSingleton(ServiceContextEvents).disposeContext).toHaveBeenCalled();
    });

    it.only('should respond with error response from the default coded error handler if the RPC call fails with error no handler can handle', async () => {
      let app = new App();

      // create custom handler that we expect to be reached
      let specificHandler = jest.fn((e: Error) => {
        if ((e as any).isJoi) {
          return {
            code: 400,
            message: 'Technical error, the request was malformed.',
            data: (e as any).details,
          };
        }
      });

      // register the handler
      app.getSingleton(RPCErrorHandlers).addErrorHandler(specificHandler);

      let requestInfo = await runMock(app, {
        method: 'test.method',
        params: {},
        response: () => Promise.reject({ code: 444, details: 'Error details' }),
      });

      // expect(err).toEqual(expect.objectContaining({ code: 444, message: 'Error details' }));
      expect(requestInfo.res.status).toHaveBeenCalledWith(444);
      expect(requestInfo.res.json).toHaveBeenCalledWith({
        code: 444,
        result: null,
        error: {
          code: 444,
          message: 'Error details',
        },
        version: 2,
        backendError: true,
      });

      expect(specificHandler).toHaveBeenCalledTimes(1);
      expect(app.getSingleton(ServiceContextEvents).disposeContext).toHaveBeenCalled();
    });

    it('should respond with 500 error response when the RPC call fails with unknown error', async () => {
      let app = new App();
      // prepare request / response

      let requestInfo = await runMock(app, {
        method: 'test.method',
        params: {},
        response: () => Promise.reject({ code: 444, details: 'Error details' }),
      });

      // expect(err).toEqual('error');
      expect(requestInfo.res.status).toHaveBeenCalledWith(500);
      expect(requestInfo.res.json).toHaveBeenCalledWith({
        code: 500,
        result: null,
        error: {
          code: 500,
          message: 'An unexpected error occurred. Please try again.',
        },
        version: 2,
        backendError: true,
      });

      expect(app.getSingleton(ServiceContextEvents).disposeContext).toHaveBeenCalled();
    });
  });
});
