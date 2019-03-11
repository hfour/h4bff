import { App, ServiceContextEvents } from '@h4bff/core';
import { RequestContextProvider } from './requestContextProvider';
import { Request, Response } from 'express';
import { RequestInfo } from './requestInfo';

describe('RequestContextProvider', () => {
  it(`#getContext should create and return serviceContext for given request / response pair`, () => {
    let app = new App();
    let requestContextProvider = new RequestContextProvider(app);
    let request = {} as Request;
    let response = {} as Response;
    let resultContext = requestContextProvider.getContext(request, response);
    expect(resultContext).toBeDefined();
  });

  it('#withRequestContext should prepare service context for given request / response pair', () => {
    let app = new App();
    let requestContextProvider = new RequestContextProvider(app);
    let request = {} as Request;
    let response = {} as Response;
    return requestContextProvider.withRequestContext(request, response, sCtx => {
      let requestInfo = sCtx.getService(RequestInfo);
      expect(requestInfo.req).toEqual(request);
      expect(requestInfo.res).toEqual(response);
      return Promise.resolve();
    });
  });

  it('#onDispose should remove disposed service context from the context map', () => {
    let app = new App();
    let requestContextProvider = new RequestContextProvider(app);
    let request = {} as Request;
    let response = {} as Response;
    let resultContext = requestContextProvider.getContext(request, response);
    app.getSingleton(ServiceContextEvents).disposeContext(resultContext, null);
    expect((requestContextProvider as any).contexts.has(request)).toBeFalsy();
  });
});