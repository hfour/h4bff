import { App, ServiceContextEvents } from '@h4bff/core';
import { RequestContextProvider } from './requestContextProvider';
import { Request, Response } from 'express';
import { RequestInfo } from './requestInfo';

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
});
