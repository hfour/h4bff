import { App, ServiceContextEvents } from '@h4bff/core';
import { RequestContextProvider } from './request-context-provider';
import { Request, Response } from 'express';
import { RequestInfo } from './request-info';

describe('RequestContextProvider', () => {
  it('#withRequestContext should prepare service context for given request / response pair', () => {
    let app = new App();
    let requestContextProvider = new RequestContextProvider(app);
    let request = {} as Request;
    let response = {} as Response;
    let ctxDisposed = false;
    app.getSingleton(ServiceContextEvents).onContextDisposed(() => {
      ctxDisposed = true;
      return Promise.resolve();
    });
    return requestContextProvider
      .withRequestContext(request, response, sCtx => {
        let requestInfo = sCtx.getService(RequestInfo);
        expect(requestInfo.req).toEqual(request);
        expect(requestInfo.res).toEqual(response);
        return Promise.resolve();
      })
      .then(() => {
        expect(ctxDisposed).toBe(true);
      });
  });
  it('should not work nested', () => {
    let request = {} as Request;
    let response = {} as Response;

    let app = new App();
    let requestContextProvider = new RequestContextProvider(app);
    return requestContextProvider
      .withRequestContext(request, response, _sctx => {
        expect(() => {
          requestContextProvider.withRequestContext(request, response, () => Promise.resolve());
        }).toThrow('Attempted to create a request context within the request context');
        return Promise.resolve();
      })
      .then(() => {
        expect(() => {
          requestContextProvider.withRequestContext(request, response, () => Promise.resolve());
        }).not.toThrow();
      });
  });
});
