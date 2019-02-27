import { AppContainer } from '@h4bff/core';
import { RequestInfo } from './requestInfo';
import { Request, Response } from 'express';

describe('RequestInfo', () => {
  it('#_setRequestResponse should set request and response', () => {
    let sCtx = new AppContainer().createServiceContext();
    let requestInfo = new RequestInfo(sCtx);
    let request = {} as Request;
    let response = {} as Response;
    requestInfo._setRequestResponse(request, response);
    expect(requestInfo.req).toEqual(request);
    expect(requestInfo.res).toEqual(response);
  });
});
