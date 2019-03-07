import { MainRouter } from './router';
import { App } from '@h4bff/core';
import * as React from 'react';
import { RouteProvider } from './routeProvider';
import { Location } from 'history';
import * as TestRenderer from 'react-test-renderer';

const lvlOnePage = jest.fn(() => <div>Example page</div>);
const lvlTwoPage = jest.fn(() => <div>Sample page</div>);

describe('router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  //MATCHES

  describe('matching routes', () => {
    it('should match a basic route', () => {
      let app = new App();

      let router = app.getSingleton(MainRouter);
      router.addRoute('/example', lvlOnePage);

      TestRenderer.create(<router.RenderInstance />);

      let routeProvider = app.getSingleton(RouteProvider);
      routeProvider.location = { pathname: '/example' } as Location;

      expect(lvlOnePage).toBeCalled();
    });

    it('should match exact route', () => {
      let app = new App();

      let router = app.getSingleton(MainRouter);
      router.addRoute('/example', lvlOnePage);
      router.addRoute('/example/route', lvlTwoPage);

      TestRenderer.create(<router.RenderInstance />);

      let routeProvider = app.getSingleton(RouteProvider);
      routeProvider.location = { pathname: '/example/route' } as Location;

      //checks that the component at the partially matched routes is not rendered.
      expect(lvlOnePage).toBeCalledTimes(0);
      expect(lvlTwoPage).toBeCalled();
    });

    it('should match only the lastly added route if they have the same path', () => {
      let app = new App();

      let router = app.getSingleton(MainRouter);
      router.addRoute('/example', lvlOnePage);
      router.addRoute('/example', lvlTwoPage);

      TestRenderer.create(<router.RenderInstance />);

      let routeProvider = app.getSingleton(RouteProvider);
      routeProvider.location = { pathname: '/example' } as Location;

      expect(lvlOnePage).toBeCalledTimes(0);
      expect(lvlTwoPage).toBeCalled();
    });

    it('should match route ending with wildcard, if path is exact with the route', () => {
      let app = new App();

      let router = app.getSingleton(MainRouter);
      router.addRoute('/example/*', lvlOnePage);

      TestRenderer.create(<router.RenderInstance />);

      let routeProvider = app.getSingleton(RouteProvider);
      routeProvider.location = { pathname: '/example' } as Location;

      expect(lvlOnePage).toBeCalled();
    });

    it('should match route ending with wildcard, if path is larger than the route', () => {
      let app = new App();

      let router = app.getSingleton(MainRouter);
      router.addRoute('/example/*', lvlOnePage);

      TestRenderer.create(<router.RenderInstance />);

      let routeProvider = app.getSingleton(RouteProvider);
      routeProvider.location = { pathname: '/example/route' } as Location;

      expect(lvlOnePage).toBeCalled();
    });
  });

  describe('handling params', () => {
    it('should extract proper route params', () => {
      let app = new App();

      let router = app.getSingleton(MainRouter);
      router.addRoute('/example/:paramone/:paramtwo', lvlOnePage);

      TestRenderer.create(<router.RenderInstance />);

      let routeProvider = app.getSingleton(RouteProvider);
      routeProvider.location = { pathname: '/example/1/2' } as Location;

      let params = lvlOnePage.mock.calls[0];
      expect(params[0].paramone).toEqual('1');
      expect(params[0].paramtwo).toEqual('2');
    });

    it('should extract proper query params', () => {
      let app = new App();

      let router = app.getSingleton(MainRouter);
      router.addRoute('/example', lvlOnePage);

      TestRenderer.create(<router.RenderInstance />);

      let routeProvider = app.getSingleton(RouteProvider);
      routeProvider.location = { pathname: '/example', search: 'first=1&second=2' } as Location;

      let params = lvlOnePage.mock.calls[0];
      expect(params[0].queryParams.first).toEqual('1');
      expect(params[0].queryParams.second).toEqual('2');
    });

    it('should extract both query and route params', () => {
      let app = new App();

      let router = app.getSingleton(MainRouter);
      router.addRoute('/example/:paramone', lvlOnePage);

      TestRenderer.create(<router.RenderInstance />);

      let routeProvider = app.getSingleton(RouteProvider);
      routeProvider.location = { pathname: '/example/p1', search: 'first=1&second=2' } as Location;

      let params = lvlOnePage.mock.calls[0];
      expect(params[0].paramone).toEqual('p1');
      expect(params[0].queryParams.first).toEqual('1');
      expect(params[0].queryParams.second).toEqual('2');
    });
  });

  //REDIRECTS

  describe('handling redirects', () => {
    it('should perform a simple redirect', () => {
      let app = new App();

      let router = app.getSingleton(MainRouter);
      router.addRedirect({ from: '/', to: '/example' });

      let routeProvider = app.getSingleton(RouteProvider);
      routeProvider.location = { pathname: '/' } as Location;

      TestRenderer.create(<router.RenderInstance />);
      expect(routeProvider.location.pathname).toEqual('/example');
    });

    it('should perform a chained (double) redirect', () => {
      let app = new App();

      let router = app.getSingleton(MainRouter);
      router.addRedirect({ from: '/', to: '/example' });
      router.addRedirect({ from: '/example', to: '/example/route' });

      let routeProvider = app.getSingleton(RouteProvider);
      routeProvider.location = { pathname: '/' } as Location;

      TestRenderer.create(<router.RenderInstance />);
      expect(routeProvider.location.pathname).toEqual('/example/route');
    });

    it('should redirect to the lastly added route if both redirects have the same "from"', () => {
      let app = new App();

      let router = app.getSingleton(MainRouter);
      router.addRedirect({ from: '/', to: '/example' });
      router.addRedirect({ from: '/', to: '/route' });

      let routeProvider = app.getSingleton(RouteProvider);
      routeProvider.location = { pathname: '/' } as Location;

      TestRenderer.create(<router.RenderInstance />);
      expect(routeProvider.location.pathname).toEqual('/route');
    });
  });
});
