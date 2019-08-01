import { App, AppSingleton } from '@h4bff/core';
import { Redirect } from '.';
import { reaction, observable, action } from 'mobx';
import { observer } from 'mobx-react';
import * as pathToRegexp from 'path-to-regexp';
import * as React from 'react';
import { History, Location } from 'history';
import * as queryString from 'query-string';
import * as _ from 'lodash';
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
export type RP = RouteParameters<any>;
export type UIElement = ((rp: RouteParameters) => JSX.Element) | null;

interface Route {
  match: (location: Location) => RouteParameters;
  component: UIElement;
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
  @observable private currentComponentJSX: UIElement = null;
  @observable private routeParams: RouteParameters = {};
  @observable private routes: Array<Route> = [];
  @observable private redirects: Array<Redirect> = [];

  constructor(private app: App) {
    reaction(
      () => [
        this.routes.length,
        this.redirects.length,
        this.app.getSingleton(RouteProvider).location.pathname,
      ],
      () => this.setCurrentComponentOrRedirect(),
    );
  }

  @action
  private setCurrentComponentOrRedirect = () => {
    const routeProvider = this.app.getSingleton(RouteProvider);
    const location = routeProvider.location;
    const matchedRedirect = this.redirects.find(redirect =>
      matchPath(location.pathname, redirect.from),
    );
    if (matchedRedirect) {
      routeProvider.browserHistory.replace(matchedRedirect.to);
    } else {
      const matchedRoute = this.routes.find(route => route.match(location) !== null);
      if (matchedRoute) {
        this.currentComponentJSX = matchedRoute.component;
        this.routeParams = matchedRoute.match(location);
      }
    }
  };

  RenderInstance = observer(() => {
    return this.currentComponentJSX ? this.currentComponentJSX(this.routeParams) : null;
  });

  @action
  addRoute = (path: string, component: (rp: RouteParameters) => JSX.Element) => {
    validatePath(path);

    //pathToRegex doesnt handle '/*' for matching anything, so we have to replace it with an aptly-named param with 0 or more occurences.
    const newPath = path.replace('/*', '/:placeholderForMatchingAnyRoute*');
    const keys: pathToRegexp.Key[] = [];
    const reg = pathToRegexp(newPath, keys);
    const match = (location: Location) => {
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
    this.routes.unshift({ match, component });
  };

  @action
  addRedirect = (newRedirect: Redirect) => {
    validatePath(newRedirect.from);
    validatePath(newRedirect.to);
    this.redirects.unshift(newRedirect);
  };
}

/**
 * Wrapper for the topmost router. It is singleton, which makes it accessible from throught the app, and
 * is rendered within a history context provider.
 */
export class Router extends AppSingleton {
  @observable router: MobxRouter;

  constructor(app: App) {
    super(app);
    this.router = new MobxRouter(app);
  }

  addRoute = (path: string, component: (rp: RouteParameters) => JSX.Element) => {
    return this.router.addRoute(path, component);
  };

  addRedirect = (newRedirect: Redirect) => {
    return this.router.addRedirect(newRedirect);
  };

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
