import { App, AppSingleton } from '@h4bff/core';
import { H4Redirect, H4RouteWithJSX } from '.';
import { RouteProvider } from './routeProvider';
import { reaction, observable, action } from 'mobx';
import { observer } from 'mobx-react';
import * as pathToRegexp from 'path-to-regexp';

export type RouteParameters = { [key: string]: string };
export type UIElement = (rp: RouteParameters) => JSX.Element;

/**
 * Frontend route provider. Listens to change of the location and updates it.
 */
export class MainRouter extends AppSingleton {
  @observable currentComponentJSX: UIElement | null = null;
  @observable routeParams: RouteParameters = {};
  routes: Array<H4RouteWithJSX> = [];
  redirects: Array<H4Redirect> = [];

  constructor(app: App) {
    super(app);
    console.log('main router provider');
    reaction(
      () => this.getSingleton(RouteProvider).location.pathname,
      pathname => {
        console.log(' IN MAIN ROUTER REACTION ', pathname);
        this.setCurrentComponentOrRedirect();
      },
    );
    this.setCurrentComponentOrRedirect();
  }

  @action
  setCurrentComponentOrRedirect() {
    const location = this.getSingleton(RouteProvider).location;
    const pathname = location.pathname;
    console.log(pathname, ' in main router');
    const matchedRedirect = this.redirects.find(redirect => this.matchPath(redirect.from, pathname));
    if (matchedRedirect) {
      console.log('mainRouter, redirecting');
      this.getSingleton(RouteProvider).browserHistory.push(matchedRedirect.to);
    } else {
      const matchedRoute = this.routes.find(route => this.matchPath(pathname, route.path));
      if (matchedRoute) {
        console.log('mainRouter, matchedRoute', matchedRoute.component);
        if (this.currentComponentJSX !== matchedRoute.component) {
          this.currentComponentJSX = matchedRoute.component;
        }
        console.log('mainRouter, matchedRoute', matchedRoute.component);
      }
    }
  }

  //Instance = observer(() => <Provider provides={history}>{this.currentComponentJSX(params)}</Provider>);

  Instance = observer(() => this.currentComponentJSX ? this.currentComponentJSX(this.routeParams) : null);

  lala = (_path: string) => {
    const regexp = pathToRegexp('/test/:lala');

    console.log('EXACT TESTING WITH /test/:lala');

    this.log(regexp, '/test/route');
    this.log(regexp, '/test');
    this.log(regexp, '/test/route/somethingbigger');
    this.log(regexp, '/');
    this.log(regexp, '/somethingdifferent');
    this.log(regexp, '/something/different');

    console.log('container TESTING WITH /test/:lala');

    this.log(regexp, '/test*');
    this.log(regexp, '/test/*');
    this.log(regexp, '/test/route');
    this.log(regexp, '/test/route/somethingbigger');
    this.log(regexp, '/');
    this.log(regexp, '/somethingdifferent');
    this.log(regexp, '/something/different');
  };

  log = (regexp: any, result: string) => {
    console.log(result, regexp.exec(result));
  };

  matchPath = (newLocation: string, savedRoute: string) => {
    console.log('newLocation, savedRoute');
    console.log(newLocation, savedRoute);
    const regexp = pathToRegexp(savedRoute);
    return regexp.exec(newLocation) != null;
  };

  addRoute(newRoute: H4RouteWithJSX) {
    console.log('add route', newRoute.path);
    //check whether newRoutes start with "/"
    // const matchedRoute = this.routes.find(route => this.matchPath(route.path, newRoute.path));
    // if (matchedRoute) {
    //   //should not be able to add a route to an already existing path
    //   throw new Error('Route already exists: ' + matchedRoute.path);
    // }

    this.routes.push(newRoute);
    this.setCurrentComponentOrRedirect();
  }

  addRedirect(newRedirect: H4Redirect) {
    console.log('add redirect', newRedirect.from);
    //check whether newRedirect routes start with "/"
    // const matchedRedirect = this.redirects.find(redirect => this.matchPath(redirect.from, newRedirect.from));
    // if (matchedRedirect) {
    //   //should not be able to add a redirect to an already existing path
    //   throw new Error('Redirect already exists: ' + matchedRedirect.from);
    // }

    this.redirects.push(newRedirect);
    this.setCurrentComponentOrRedirect();
  }
}
