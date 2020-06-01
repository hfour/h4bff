import * as Promise from 'bluebird';
import { App, BaseService, ServiceContextEvents } from '@h4bff/core';
import { Request, Response } from 'express';
import { RequestInfo } from '../request';
import { RPCDispatcher } from './dispatcher';
import { RPCServiceRegistry } from './service-registry';
import { RPCMiddlewareContainer } from './middleware';
import { RPCErrorHandlers } from '.';

describe('RPCDispatcher', () => {
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

  describe('handleRequest', () => {
    it(`should respond with error if method is not found in the request query params`, () => {
      let app = new App();
      // prepare request / response
      app.overrideService(
        RequestInfo,
        class MockRequestInfo extends RequestInfo {
          req = mockRequest();
          res = mockResponse();
        },
      );
      return app.withServiceContext(sCtx => {
        let rpcDispatcher = sCtx.getService(RPCDispatcher);
        let requestInfo = sCtx.getService(RequestInfo);

        return Promise.resolve(rpcDispatcher.handleRequest()).then(() => {
          expect(requestInfo.res.status).toHaveBeenCalledWith(400);
          expect(requestInfo.res.json).toHaveBeenCalledWith({
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
      });
    });

    it(`should respond with error if body params are not found in the request`, () => {
      let app = new App();
      // prepare request / response
      app.overrideService(
        RequestInfo,
        class MockRequestInfo extends RequestInfo {
          req = mockRequest('test.method');
          res = mockResponse();
        },
      );
      return app.withServiceContext(sCtx => {
        let rpcDispatcher = sCtx.getService(RPCDispatcher);
        let requestInfo = sCtx.getService(RequestInfo);

        return Promise.resolve(rpcDispatcher.handleRequest()).then(() => {
          expect(requestInfo.res.status).toHaveBeenCalledWith(400);
          expect(requestInfo.res.json).toHaveBeenCalledWith({
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
      });
    });

    it(`should respond with error if method doesn't exist on the service`, () => {
      let app = new App();
      // prepare request / response
      app.overrideService(
        RequestInfo,
        class MockRequestInfo extends RequestInfo {
          req = mockRequest('test.method', {});
          res = mockResponse();
        },
      );
      // prepare mock service
      app.getSingleton(RPCServiceRegistry).add(
        'test',
        class TestService extends BaseService {
          none() {
            return Promise.resolve();
          }
        },
      );
      return app.withServiceContext(sCtx => {
        let rpcDispatcher = sCtx.getService(RPCDispatcher);
        let requestInfo = sCtx.getService(RequestInfo);

        expect(rpcDispatcher.serviceMethod).toEqual(undefined);
        return Promise.resolve(rpcDispatcher.handleRequest()).then(() => {
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
    });
  });

  describe('RPC call execution', () => {
    it('should respond with success and dispose context in normal circumstances', () => {
      let app = new App();
      // prepare request / response
      app.overrideService(
        RequestInfo,
        class MockRequestInfo extends RequestInfo {
          req = mockRequest('test.method', {});
          res = mockResponse();
        },
      );
      // mock middleware call
      app.overrideSingleton(
        RPCMiddlewareContainer,
        class MockRPCMiddlewareContainer extends RPCMiddlewareContainer {
          call = jest.fn(() => Promise.resolve('data'));
        },
      );
      // mock disposeContext call
      app.overrideSingleton(
        ServiceContextEvents,
        class MockServiceContextEvents extends ServiceContextEvents {
          disposeContext = jest.fn(() => Promise.resolve());
        },
      );

      return app
        .withServiceContext(sCtx => {
          let rpcDispatcher = sCtx.getService(RPCDispatcher);
          let requestInfo = sCtx.getService(RequestInfo);

          return rpcDispatcher.call().then(() => {
            expect(requestInfo.res.status).toHaveBeenCalledWith(200);
            expect(requestInfo.res.json).toHaveBeenCalledWith({
              code: 200,
              result: 'data',
              error: null,
              version: 2,
            });
          });
        })
        .then(() => {
          expect(app.getSingleton(ServiceContextEvents).disposeContext).toHaveBeenCalled();
        });
    });

    it('should respond with custom success response and dispose context for specific results', () => {
      let app = new App();
      // prepare request / response
      app.overrideService(
        RequestInfo,
        class MockRequestInfo extends RequestInfo {
          req = mockRequest('test.method', {});
          res = mockResponse();
        },
      );
      // mock middleware call and prepare custom response
      let mockData = {
        sendToHTTPResponse: jest.fn(() => Promise.resolve('test')),
      };
      app.overrideSingleton(
        RPCMiddlewareContainer,
        class MockRPCMiddlewareContainer extends RPCMiddlewareContainer {
          call = jest.fn(() => Promise.resolve(mockData));
        },
      );
      // mock disposeContext call
      app.overrideSingleton(
        ServiceContextEvents,
        class MockServiceContextEvents extends ServiceContextEvents {
          disposeContext = jest.fn(() => Promise.resolve());
        },
      );

      return app
        .withServiceContext(sCtx => {
          let rpcDispatcher = sCtx.getService(RPCDispatcher);
          let requestInfo = sCtx.getService(RequestInfo);

          return rpcDispatcher.call().then(() => {
            expect(mockData.sendToHTTPResponse).toHaveBeenCalledWith(requestInfo.res, 200);
          });
        })
        .then(() => {
          expect(app.getSingleton(ServiceContextEvents).disposeContext).toHaveBeenCalled();
        });
    });

    it('should respond with error response when the RPC call fails', () => {
      let app = new App();
      // prepare request / response
      app.overrideService(
        RequestInfo,
        class MockRequestInfo extends RequestInfo {
          req = mockRequest('test.method', {});
          res = mockResponse();
        },
      );
      // mock middleware call and prepare erroneous response
      app.overrideSingleton(
        RPCMiddlewareContainer,
        class MockRPCMiddlewareContainer extends RPCMiddlewareContainer {
          call = jest.fn(() => Promise.reject({ code: 403, message: 'error' }));
        },
      );
      // mock disposeContext call
      app.overrideSingleton(
        ServiceContextEvents,
        class MockServiceContextEvents extends ServiceContextEvents {
          disposeContext = jest.fn(() => Promise.resolve());
        },
      );

      return app
        .withServiceContext(sCtx => {
          let rpcDispatcher = sCtx.getService(RPCDispatcher);
          let requestInfo = sCtx.getService(RequestInfo);

          return rpcDispatcher.call().then(
            () => {},
            err => {
              expect(err).toEqual(expect.objectContaining({ code: 403, message: 'error' }));
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
            },
          );
        })
        .then(() => {
          expect(app.getSingleton(ServiceContextEvents).disposeContext).toHaveBeenCalled();
        });
    });

    it('should respond with error response from a registered error handler when the RPC call fails with error the handler can handle', () => {
      let app = new App();

      // prepare request / response
      app.overrideService(
        RequestInfo,
        class MockRequestInfo extends RequestInfo {
          req = mockRequest('test.method', {});
          res = mockResponse();
        },
      );

      // mock middleware call and prepare erroneous response
      app.overrideSingleton(
        RPCMiddlewareContainer,
        class MockRPCMiddlewareContainer extends RPCMiddlewareContainer {
          call = jest.fn(() => Promise.reject({ isJoi: true, details: 'Error details' }));
        },
      );

      // register dummy handler to ensure the correct handler can be reached
      let dummyHandlerNotHandling = jest.fn((_e: Error) => undefined);

      // register custom handler that we expect to be reached
      let specificHandlerHandling = jest.fn((e: Error) => {
        if ((e as any).isJoi) {
          return {
            code: 400,
            message: 'Technical error, the request was malformed.',
            data: (e as any).details,
          };
        }
      });

      // register the handles in order
      app.getSingleton(RPCErrorHandlers).addErrorHandler(dummyHandlerNotHandling);
      app.getSingleton(RPCErrorHandlers).addErrorHandler(specificHandlerHandling);

      // mock disposeContext call
      app.overrideSingleton(
        ServiceContextEvents,
        class MockServiceContextEvents extends ServiceContextEvents {
          disposeContext = jest.fn(() => Promise.resolve());
        },
      );

      return app
        .withServiceContext(sCtx => {
          let rpcDispatcher = sCtx.getService(RPCDispatcher);
          let requestInfo = sCtx.getService(RequestInfo);

          return rpcDispatcher.call().then(
            () => {},
            err => {
              expect(err).toEqual(
                expect.objectContaining({ isJoi: true, details: 'Error details' }),
              );
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
            },
          );
        })
        .then(() => {
          expect(dummyHandlerNotHandling).not.toHaveBeenCalled();
          expect(specificHandlerHandling).toHaveBeenCalledTimes(1);
          expect(app.getSingleton(ServiceContextEvents).disposeContext).toHaveBeenCalled();
        });
    });

    it('should respond with error response from the last registered error handler when the RPC call fails with error that the handler can handle', () => {
      let app = new App();

      // prepare request / response
      app.overrideService(
        RequestInfo,
        class MockRequestInfo extends RequestInfo {
          req = mockRequest('test.method', {});
          res = mockResponse();
        },
      );

      // mock middleware call and prepare erroneous response
      app.overrideSingleton(
        RPCMiddlewareContainer,
        class MockRPCMiddlewareContainer extends RPCMiddlewareContainer {
          call = jest.fn(() => Promise.reject({ isJoi: true, details: 'Error details' }));
        },
      );

      // register handler that can handle the error but cannot be reached? reached
      let specificHandlerNotHandling = jest.fn((e: Error) => {
        if ((e as any).isJoi) {
          return {
            code: 400,
            message: 'Technical error, the request was malformed.',
            data: (e as any).details,
          };
        }
      });

      // register third handler with same condition as the previous to ensure it was not reached
      let specificHandlerHandling = jest.fn((e: Error) => {
        if ((e as any).isJoi) {
          return {
            code: 444,
            message: 'I am the most recently registered handler and I am handling the error.',
            data: (e as any).details,
          };
        }
      });

      // register the handles in order
      app.getSingleton(RPCErrorHandlers).addErrorHandler(specificHandlerNotHandling);
      app.getSingleton(RPCErrorHandlers).addErrorHandler(specificHandlerHandling);

      // mock disposeContext call
      app.overrideSingleton(
        ServiceContextEvents,
        class MockServiceContextEvents extends ServiceContextEvents {
          disposeContext = jest.fn(() => Promise.resolve());
        },
      );

      return app
        .withServiceContext(sCtx => {
          let rpcDispatcher = sCtx.getService(RPCDispatcher);
          let requestInfo = sCtx.getService(RequestInfo);

          return rpcDispatcher.call().then(
            () => {},
            err => {
              expect(err).toEqual(
                expect.objectContaining({ isJoi: true, details: 'Error details' }),
              );
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
            },
          );
        })
        .then(() => {
          expect(specificHandlerNotHandling).not.toHaveBeenCalledWith();
          expect(specificHandlerHandling).toHaveBeenCalledTimes(1);
          expect(app.getSingleton(ServiceContextEvents).disposeContext).toHaveBeenCalled();
        });
    });

    it('should respond with 500 error response when the RPC call fails with unknown error', () => {
      let app = new App();
      // prepare request / response
      app.overrideService(
        RequestInfo,
        class MockRequestInfo extends RequestInfo {
          req = mockRequest('test.method', {});
          res = mockResponse();
        },
      );
      // mock middleware call and prepare erroneous response
      app.overrideSingleton(
        RPCMiddlewareContainer,
        class MockRPCMiddlewareContainer extends RPCMiddlewareContainer {
          call = jest.fn(() => Promise.reject('error'));
        },
      );
      // mock disposeContext call
      app.overrideSingleton(
        ServiceContextEvents,
        class MockServiceContextEvents extends ServiceContextEvents {
          disposeContext = jest.fn(() => Promise.resolve());
        },
      );
      return app
        .withServiceContext(sCtx => {
          let rpcDispatcher = sCtx.getService(RPCDispatcher);
          let requestInfo = sCtx.getService(RequestInfo);

          return rpcDispatcher.call().then(
            () => {},
            err => {
              expect(err).toEqual('error');
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
            },
          );
        })
        .then(() => {
          expect(app.getSingleton(ServiceContextEvents).disposeContext).toHaveBeenCalled();
        });
    });
  });
});
