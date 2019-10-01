import { App, AppSingleton } from '@h4bff/core';
import { Redirect } from '.';
import { observable, action, autorun, computed } from 'mobx';
import { observer } from 'mobx-react';
import * as pathToRegexp from 'path-to-regexp';
import * as React from 'react';
import { History, Location } from 'history';
import * as queryString from 'query-string';
import { RouteProvider } from './routeProvider';
import { matchPath, validatePath } from './routerUtils';
import { AppContext } from '../app-context';

export const HistoryContext = React.createContext({} as HistoryContextProps);
export interface HistoryContextProps {
  history: History;
  location: string;
}

export type Params = { [key: string]: string } | { queryParams?: { [key: string]: string } };
export type RouteParameters<T extends Params = {}> = T;

interface Route<T> {
  match: (location: Location) => boolean;
  extractParams: (location: Location) => RouteParameters<T>;
  component: (rp: RouteParameters<T>) => JSX.Element;
}

export interface Redirect {
  from: string;
  to: string;
}

/**
 * Frontend nestable router. Reacts to change of the url pathname and renders the suitable component.
 *
 * If several routes are matched, only the lastly added will be rendered.
 * All routes are strictly matched. For rendering a container route, just suffix it with "/*", so it will match any of the child routes.
 *
 */
class MobxRouter {
  @observable private routes: Array<Route<any>> = [];
  @observable private redirects: Array<Redirect> = [];

  constructor(private app: App) {
    autorun(() => {
      if (this.matchedRedirect != null) {
        app.getSingleton(RouteProvider).browserHistory.replace(this.matchedRedirect.to);
      }
    });
  }

  @computed get location() {
    return this.app.getSingleton(RouteProvider).location;
  }

  @computed get matchedRedirect() {
    return this.redirects.find(redirect =>
      matchPath(this.location.pathname, redirect.from, { exact: true }),
    );
  }

  @computed get routeParams() {
    return this.matchedRoute && this.matchedRoute.extractParams(this.location);
  }

  @computed get matchedRoute() {
    if (this.matchedRedirect) return null;
    for (let route of this.routes) {
      if (route.match(this.location)) {
        return route;
      }
    }
    return null;
  }

  @action.bound
  addRoute<T>(path: string, component: (rp: RouteParameters<T>) => JSX.Element) {
    validatePath(path);

    //pathToRegex doesn't handle '/*' for matching anything, so we have to replace it with an aptly-named param with 0 or more occurrences.
    const newPath = path.replace('/*', '/:placeholderForMatchingAnyRoute*');
    const keys: pathToRegexp.Key[] = [];
    const reg = pathToRegexp(newPath, keys);

    const match = (location: Location) => {
      return !!location.pathname.match(reg);
    };

    const extractParams = (location: Location) => {
      const r = location.pathname.match(reg);
      if (r === null) {
        return null;
      }

      let params: any = {};
      for (let k = 0; k < keys.length; ++k) {
        params[keys[k].name] = r[k + 1];
      }
      params['queryParams'] = queryString.parse(location.search);

      return params;
    };

    this.routes.unshift({ match, extractParams, component });
  }

  @action.bound
  addRedirect(newRedirect: Redirect) {
    validatePath(newRedirect.from);
    validatePath(newRedirect.to);
    this.redirects.unshift(newRedirect);
  }

  RenderInstance = observer(() => {
    return this.matchedRoute && this.matchedRoute.component(this.routeParams);
  });
}

/**
 * Wrapper for the topmost router. It is singleton, which makes it accessible from throught the app, and
 * is rendered within a history context provider.
 */
export class Router extends AppSingleton {
  @observable private router = new MobxRouter(this.app);

  addRoute = (path: string, component: (rp: RouteParameters) => JSX.Element) => {
    return this.router.addRoute(path, component);
  };

  addRedirect = (newRedirect: Redirect) => {
    return this.router.addRedirect(newRedirect);
  };

  @computed
  get routeParams() {
    return this.router.routeParams;
  }

  RenderInstance = observer(() => {
    const routeProvider = this.getSingleton(RouteProvider);
    return (
      <AppContext.Provider value={{ app: this.app }}>
        <HistoryContext.Provider
          value={{
            history: routeProvider.browserHistory,
            location: routeProvider.location.pathname,
          }}
        >
          <this.router.RenderInstance />
        </HistoryContext.Provider>
      </AppContext.Provider>
    );
  });
}
