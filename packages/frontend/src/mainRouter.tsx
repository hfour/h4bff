import { App, AppSingleton } from '@h4bff/core';
import { H4Redirect } from '.';
import { RouteProvider } from './routeProvider';
import { reaction, observable, action } from 'mobx';
import { observer } from 'mobx-react';
import * as pathToRegexp from 'path-to-regexp';

export type RouteParameters = { [key: string]: string } | null;
export type UIElement = ((rp: RouteParameters) => JSX.Element) | null;

interface H4Route {
  match: (path: string) => RouteParameters;
  component: UIElement;
}

/**
 * Frontend route provider. Listens to change of the location and updates it.
 */
export class MainRouter extends AppSingleton {
  @observable
  private currentComponentJSX: UIElement = null;
  @observable
  private routeParams: RouteParameters = null;
  private routes: Array<H4Route> = [];
  private redirects: Array<H4Redirect> = [];

  constructor(app: App) {
    super(app);
    reaction(() => this.getSingleton(RouteProvider).location.pathname, () => this.setCurrentComponentOrRedirect());
    this.setCurrentComponentOrRedirect(); //check whether you can observe this, and not call it explicitly.
  }

  @action
  private setCurrentComponentOrRedirect() {
    const routeProvider = this.getSingleton(RouteProvider);
    const pathname = routeProvider.location.pathname;
    const matchedRedirect = this.redirects.find(redirect => this.matchPath(pathname, redirect.from));
    if (matchedRedirect) {
      routeProvider.browserHistory.push(matchedRedirect.to);
    } else {
      const matchedRoute = this.routes.find(route => route.match(pathname) !== null);
      if (matchedRoute && this.currentComponentJSX !== matchedRoute.component) {
        this.currentComponentJSX = matchedRoute.component;
        this.routeParams = matchedRoute.match(pathname);
      }
    }
  }

  //Instance = observer(() => <Provider provides={history}>{this.currentComponentJSX(params)}</Provider>);

  Instance = observer(() => (this.currentComponentJSX ? this.currentComponentJSX(this.routeParams) : null));

  matchPath = (currentPath: string, redirectFrom: string) => {
    const regexp = pathToRegexp(redirectFrom);
    return regexp.exec(currentPath) != null;
  };

  addRoute(path: string, component: (rp: RouteParameters) => JSX.Element) {
    console.log('add route', path);
    //TODO, Emil: validate route - whether it starts with "/", and check for colisions with other routes in the same lvl

    const keys: pathToRegexp.Key[] = [];
    const reg = pathToRegexp(path, keys);
    const match = (path: string) => {
      const r = path.match(reg);
      if (r === null) {
        return null;
      }

      let params: RouteParameters = {};
      for (let k = 0; k < keys.length; ++k) {
        params[keys[k].name] = r[k + 1];
      }
      return params;
    };
    this.routes.push({ match, component });
    this.setCurrentComponentOrRedirect();
  }

  addRedirect(newRedirect: H4Redirect) {
    console.log('add redirect', newRedirect.from);
    //TODO, Emil: validate route - whether it starts with "/", and check for colisions with other routes in the same lvl

    this.redirects.push(newRedirect);
    this.setCurrentComponentOrRedirect(); //check whether you can observe this
  }
}
