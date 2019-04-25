import * as Promise from 'bluebird';
import { App } from '@h4bff/core';
import { RPCDispatcher } from './dispatcher';
import { RPCMiddlewareContainer } from './middleware';

describe('RPCMiddlewareContainer', () => {
  it(`should execute RPC call normally when proper middleware added`, () => {
    let app = new App();
    app.overrideService(
      RPCDispatcher,
      class MockRPCDispatcher extends RPCDispatcher {
        handleRequest = () => Promise.resolve('RPC finished');
      },
    );

    // add middleware
    app.getSingleton(RPCMiddlewareContainer).addMiddleware((_dispatcher, next) => {
      return next();
    });

    // invoke the RPC call
    app.withServiceContext(sCtx => {
      return app
        .getSingleton(RPCMiddlewareContainer)
        .call(sCtx.getService(RPCDispatcher))
        .then(result => {
          expect(result).toEqual('RPC finished');
        });
    });
  });

  it(`should execute RPC call normally when multiple middlewares added`, () => {
    let app = new App();
    app.overrideService(
      RPCDispatcher,
      class MockRPCDispatcher extends RPCDispatcher {
        handleRequest = () => Promise.resolve('RPC finished');
      },
    );

    // add middlewares
    app.getSingleton(RPCMiddlewareContainer).addMiddleware((_dispatcher, next) => {
      return next();
    });
    app.getSingleton(RPCMiddlewareContainer).addMiddleware((_dispatcher, next) => {
      return next();
    });

    // invoke the RPC call
    app.withServiceContext(sCtx => {
      return app
        .getSingleton(RPCMiddlewareContainer)
        .call(sCtx.getService(RPCDispatcher))
        .then(result => {
          expect(result).toEqual('RPC finished');
        });
    });
  });

  it(`should execute RPC call normally when proper 'Around' middleware added`, () => {
    let app = new App();
    app.overrideService(
      RPCDispatcher,
      class MockRPCDispatcher extends RPCDispatcher {
        handleRequest = () => Promise.resolve('RPC finished');
      },
    );

    // add middleware
    app.getSingleton(RPCMiddlewareContainer).addMiddleware((_dispatcher, next) => {
      return next().then(result => {
        return result;
      });
    });

    // invoke the RPC call
    app.withServiceContext(sCtx => {
      return app
        .getSingleton(RPCMiddlewareContainer)
        .call(sCtx.getService(RPCDispatcher))
        .then(result => {
          expect(result).toEqual('RPC finished');
        });
    });
  });

  it(`should not return RPC result if middleware doesn't continue the call chain by returning next`, () => {
    let app = new App();
    app.overrideService(
      RPCDispatcher,
      class MockRPCDispatcher extends RPCDispatcher {
        handleRequest = () => Promise.resolve('RPC finished');
      },
    );

    // add middleware
    app.getSingleton(RPCMiddlewareContainer).addMiddleware((_dispatcher, _next) => {
      return Promise.resolve(null);
    });

    // invoke the RPC call
    app.withServiceContext(sCtx => {
      return app
        .getSingleton(RPCMiddlewareContainer)
        .call(sCtx.getService(RPCDispatcher))
        .then(result => {
          expect(result).toBeNull();
        });
    });
  });

  it(`should reject the promise if error occurs in middleware`, () => {
    let app = new App();
    app.overrideService(
      RPCDispatcher,
      class MockRPCDispatcher extends RPCDispatcher {
        handleRequest = () => Promise.resolve('RPC finished');
      },
    );

    // add middleware
    app.getSingleton(RPCMiddlewareContainer).addMiddleware((_dispatcher, _next) => {
      throw new Error('Test');
    });

    // invoke the RPC call
    app.withServiceContext(sCtx => {
      return app
        .getSingleton(RPCMiddlewareContainer)
        .call(sCtx.getService(RPCDispatcher))
        .catch((e: Error) => {
          return expect(e.message).toEqual('Test');
        });
    });
  });
});
