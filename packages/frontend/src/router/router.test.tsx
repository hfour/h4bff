import { MainRouter } from './router';
import { App } from '@h4bff/core';
import * as React from 'react';
import { RouteProvider } from './routeProvider';
import { Location } from 'history';
import * as TestRenderer from 'react-test-renderer';
import * as url from 'url';

const lvlOnePage = jest.fn(() => <div>Example page</div>);
const lvlTwoPage = jest.fn(() => <div>Sample page</div>);

describe('router', () => {
  let app: App;
  const visitUrl = (path: string) => {
    const router = app.getSingleton(MainRouter);
    TestRenderer.create(<router.RenderInstance />);

    const routeProvider = app.getSingleton(RouteProvider);
    const parsedUrl = url.parse(path);

    routeProvider.location = { pathname: parsedUrl.pathname, search: parsedUrl.search } as Location;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  describe('matching routes', () => {
    it('should match a basic route', () => {
      let router = app.getSingleton(MainRouter);
      router.addRoute('/example', lvlOnePage);

      visitUrl('/example');
      expect(lvlOnePage).toBeCalled();
    });

    it('should match exact route', () => {
      let router = app.getSingleton(MainRouter);
      router.addRoute('/example', lvlOnePage);
      router.addRoute('/example/route', lvlTwoPage);

      visitUrl('/example/route');

      //checks that the component at the partially matched routes is not rendered.
      expect(lvlOnePage).toBeCalledTimes(0);
      expect(lvlTwoPage).toBeCalled();
    });

    it('should match only the lastly added route if they have the same path', () => {
      let router = app.getSingleton(MainRouter);
      router.addRoute('/example', lvlOnePage);
      router.addRoute('/example', lvlTwoPage);

      visitUrl('/example');

      expect(lvlOnePage).toBeCalledTimes(0);
      expect(lvlTwoPage).toBeCalled();
    });

    it('should match route ending with wildcard, if path is exact with the route', () => {
      let router = app.getSingleton(MainRouter);
      router.addRoute('/example/*', lvlOnePage);

      visitUrl('/example');
      expect(lvlOnePage).toBeCalled();
    });

    it('should match route ending with wildcard, if path is larger than the route', () => {
      let router = app.getSingleton(MainRouter);
      router.addRoute('/example/*', lvlOnePage);

      visitUrl('/example/route');

      expect(lvlOnePage).toBeCalled();
    });
  });

  describe('handling params', () => {
    it('should extract proper route params', () => {
      let router = app.getSingleton(MainRouter);
      router.addRoute('/example/:paramone/:paramtwo', lvlOnePage);

      visitUrl('/example/1/2');

      let params = lvlOnePage.mock.calls[0];
      expect(params[0].paramone).toEqual('1');
      expect(params[0].paramtwo).toEqual('2');
    });

    it('should extract proper query params', () => {
      let router = app.getSingleton(MainRouter);
      router.addRoute('/example', lvlOnePage);

      visitUrl('/example?first=1&second=2');

      let params = lvlOnePage.mock.calls[0];
      expect(params[0].queryParams.first).toEqual('1');
      expect(params[0].queryParams.second).toEqual('2');
    });

    it('should extract both query and route params', () => {
      let router = app.getSingleton(MainRouter);
      router.addRoute('/example/:paramone', lvlOnePage);

      visitUrl('/example/p1?first=1&second=2');

      let params = lvlOnePage.mock.calls[0];
      expect(params[0].paramone).toEqual('p1');
      expect(params[0].queryParams.first).toEqual('1');
      expect(params[0].queryParams.second).toEqual('2');
    });
  });

  describe.only('handling redirects', () => {
    it('should perform a simple redirect', () => {
      let router = app.getSingleton(MainRouter);
      router.addRedirect({ from: '/', to: '/example' });

      visitUrl('/');

      let routeProvider = app.getSingleton(RouteProvider);
      expect(routeProvider.location.pathname).toEqual('/example');
    });

    it('should perform a chained (double) redirect', () => {
      let router = app.getSingleton(MainRouter);
      router.addRedirect({ from: '/', to: '/example' });
      router.addRedirect({ from: '/example', to: '/example/route' });

      visitUrl('/');

      let routeProvider = app.getSingleton(RouteProvider);
      expect(routeProvider.location.pathname).toEqual('/example/route');
    });

    it('should redirect to the lastly added route if both redirects have the same "from"', () => {
      let router = app.getSingleton(MainRouter);
      router.addRedirect({ from: '/', to: '/example' });
      router.addRedirect({ from: '/', to: '/route' });

      visitUrl('/');

      let routeProvider = app.getSingleton(RouteProvider);
      expect(routeProvider.location.pathname).toEqual('/route');
    });

    it('should redirect from url with query param', () => {
      let router = app.getSingleton(MainRouter);
      router.addRedirect({ from: '/example', to: '/redirected' });

      visitUrl('/example?query=1');

      let routeProvider = app.getSingleton(RouteProvider);
      expect(routeProvider.location.pathname).toEqual('/redirected');
    });

    it('should redirect from url with route param', () => {
      let router = app.getSingleton(MainRouter);
      router.addRedirect({ from: '/example/:param', to: '/redirected' });

      visitUrl('/example/1');

      let routeProvider = app.getSingleton(RouteProvider);
      expect(routeProvider.location.pathname).toEqual('/redirected');
    });

    it('should NOT redirect from url if route param doesnt match', () => {
      let router = app.getSingleton(MainRouter);
      router.addRedirect({ from: '/example/:param', to: '/redirected' });

      visitUrl('/example');

      let routeProvider = app.getSingleton(RouteProvider);
      expect(routeProvider.location.pathname).toEqual('/example');
    });
  });
});
