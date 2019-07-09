import { App } from '@h4bff/core';
import * as React from 'react';
import { Location } from 'history';
import * as TestRenderer from 'react-test-renderer';
import * as url from 'url';
import { RouteProvider } from './routeProvider';
import { Router } from './router';
import { AppContext } from '../app-context';

const potatoesPage = jest.fn(_p1 => <div>Example page</div>);
const carsPage = jest.fn(_p1 => <div>Sample page</div>);

describe('router', () => {
  let app: App;
  let router: Router;

  const visitUrl = (path: string) => {
    TestRenderer.create(<router.RenderInstance />);

    const routeProvider = app.getSingleton(RouteProvider);
    const parsedUrl = url.parse(path);

    routeProvider.location = { pathname: parsedUrl.pathname, search: parsedUrl.search } as Location;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
    router = app.getSingleton(Router);
  });

  describe('matching routes', () => {
    it('should match a basic route', () => {
      router.addRoute('/example', potatoesPage);
      visitUrl('/example');
      expect(potatoesPage).toBeCalled();
    });

    it('should match exact route', () => {
      router.addRoute('/example', potatoesPage);
      router.addRoute('/example/route', carsPage);
      visitUrl('/example/route');

      //checks that the component at the partially matched routes is not rendered.
      expect(potatoesPage).toBeCalledTimes(0);
      expect(carsPage).toBeCalled();
    });

    it('should match only the lastly added route if they have the same path', () => {
      router.addRoute('/example', potatoesPage);
      router.addRoute('/example', carsPage);
      visitUrl('/example');

      expect(potatoesPage).toBeCalledTimes(0);
      expect(carsPage).toBeCalled();
    });

    it('should match route ending with wildcard, if path is exact with the route', () => {
      router.addRoute('/example/*', potatoesPage);
      visitUrl('/example');

      expect(potatoesPage).toBeCalled();
    });

    it('should match route ending with wildcard, if path is larger than the route', () => {
      router.addRoute('/example/*', potatoesPage);
      visitUrl('/example/route');

      expect(potatoesPage).toBeCalled();
    });
  });

  describe('visiting non-existing routes', () => {
    // todo: do we need more sophisticated 404 logic, like throwing something / printing warning?
    it('should not render pages when the route doesnt match', () => {
      router.addRoute('/example', potatoesPage);
      visitUrl('/example/404');
      visitUrl('/doesnt-exist');

      expect(potatoesPage).not.toBeCalled();
    });
  });

  describe('handling params', () => {
    it('should extract proper route params', () => {
      router.addRoute('/example/:paramone/:paramtwo', potatoesPage);
      visitUrl('/example/1/2');

      let params = potatoesPage.mock.calls[0];
      expect(params[0].paramone).toEqual('1');
      expect(params[0].paramtwo).toEqual('2');
    });

    it('should extract proper query params', () => {
      router.addRoute('/example', potatoesPage);
      visitUrl('/example?first=1&second=2');

      let params = potatoesPage.mock.calls[0];
      expect(params[0].queryParams.first).toEqual('1');
      expect(params[0].queryParams.second).toEqual('2');
    });

    it('should extract both query and route params', () => {
      router.addRoute('/example/:paramone', potatoesPage);
      visitUrl('/example/p1?first=1&second=2');

      let params = potatoesPage.mock.calls[0];
      expect(params[0].paramone).toEqual('p1');
      expect(params[0].queryParams.first).toEqual('1');
      expect(params[0].queryParams.second).toEqual('2');
    });
  });

  describe('handling redirects', () => {
    it('should perform a simple redirect', () => {
      router.addRedirect({ from: '/', to: '/example' });
      visitUrl('/');

      let routeProvider = app.getSingleton(RouteProvider);
      expect(routeProvider.location.pathname).toEqual('/example');
    });

    it('should perform a chained (double) redirect', () => {
      router.addRedirect({ from: '/', to: '/example' });
      router.addRedirect({ from: '/example', to: '/example/route' });
      visitUrl('/');

      let routeProvider = app.getSingleton(RouteProvider);
      expect(routeProvider.location.pathname).toEqual('/example/route');
    });

    it('should redirect to the lastly added route if both redirects have the same "from"', () => {
      router.addRedirect({ from: '/', to: '/example' });
      router.addRedirect({ from: '/', to: '/route' });
      visitUrl('/');

      let routeProvider = app.getSingleton(RouteProvider);
      expect(routeProvider.location.pathname).toEqual('/route');
    });

    it('should redirect from url with query param', () => {
      router.addRedirect({ from: '/example', to: '/redirected' });
      visitUrl('/example?query=1');

      let routeProvider = app.getSingleton(RouteProvider);
      expect(routeProvider.location.pathname).toEqual('/redirected');
    });

    it('should redirect from url with route param', () => {
      router.addRedirect({ from: '/example/:param', to: '/redirected' });
      visitUrl('/example/1');

      let routeProvider = app.getSingleton(RouteProvider);
      expect(routeProvider.location.pathname).toEqual('/redirected');
    });

    it('should NOT redirect from url if route param doesnt match', () => {
      router.addRedirect({ from: '/example/:param', to: '/redirected' });
      visitUrl('/example');

      let routeProvider = app.getSingleton(RouteProvider);
      expect(routeProvider.location.pathname).toEqual('/example');
    });
  });

  describe('app provider', () => {
    it('should provide the app correctly', () => {
      let NameSingleton = (_app: App) => {
        return { appName: 'default' };
      };

      const appNamePage = () => (
        <AppContext.Consumer>
          {context => context.app.getSingleton(NameSingleton).appName}
        </AppContext.Consumer>
      );

      app.getSingleton(NameSingleton).appName = 'HelloWorld';
      router.addRoute('/appname', appNamePage);
      visitUrl('/appname');
      let renderer = TestRenderer.create(<router.RenderInstance />);

      let result = renderer.toJSON();

      expect(result).toEqual('HelloWorld');
    });
  });

});
