import { App, AppSingleton } from '@h4bff/core';
import { H4Redirect, H4RouteWithJSX } from '.';
import { RouteProvider } from './routeProvider';
import { reaction, observable, action, runInAction } from 'mobx';

/**
 * Frontend route provider. Listens to change of the location and updates it.
 */
export class MainRouter extends AppSingleton {
  @observable currentComponentJSX: JSX.Element | null = null;
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
    //const pathname = this.state.location.pathname;
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
        runInAction(() => {
          if (this.currentComponentJSX !== matchedRoute.component) {
            this.currentComponentJSX = matchedRoute.component;
          }
        });
        console.log('mainRouter, matchedRoute', matchedRoute.component);
      }
    }
  }

  matchPath = (newLocation: string, savedRoute: string) => {
    //some logic here!
    console.log('newLocation, savedRoute');
    console.log(newLocation, savedRoute);
    return newLocation === savedRoute;
    //return true;
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
