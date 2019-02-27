import { App, AppSingleton } from '@h4bff/core';
import { H4Redirect } from '.';
import { RouteProvider } from './routeProvider';
import { reaction, observable, action } from 'mobx';
import { observer } from 'mobx-react';
import * as pathToRegexp from 'path-to-regexp';
import * as React from 'react';
import { History, Location } from 'history';
import { matchPath } from './utils';
import * as queryString from 'query-string';
import * as _ from 'lodash';

export const HistoryContext = React.createContext({} as HistoryContextProps);
export interface HistoryContextProps {
  history: History;
  location: string;
}

export type Params = { [key: string]: string } | { queryParams?: { [key: string]: string } };
export type RouteParameters<T extends Params = {}> = T;
export type UIElement = ((rp: RouteParameters) => JSX.Element) | null;

interface H4Route {
  match: (location: Location) => RouteParameters;
  component: UIElement;
}

export interface H4Redirect {
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
export class Router {
  /**
   * have this in some BC:
   * Pros for having it nestable:
   * - each router can/will match only one route. If we want to match several components, we have to either have several routers, or rework the matching
   *
   * Cons for having it nestable:
   * - you might want to have some highly distributed component that reacts on certain route.
   */
  @observable private currentComponentJSX: UIElement = null;
  @observable private routeParams: RouteParameters = {};
  private routes: Array<H4Route> = [];
  private redirects: Array<H4Redirect> = [];

  constructor(private app: App) {
    reaction(() => this.app.getSingleton(RouteProvider).location.pathname, () => this.setCurrentComponentOrRedirect());
    this.setCurrentComponentOrRedirect(); //check whether you can observe this, and not call it explicitly. Maybe make it "get computed", and use it in the observer
  }

  @action
  private setCurrentComponentOrRedirect = () => {
    const routeProvider = this.app.getSingleton(RouteProvider);
    const location = routeProvider.location;
    const matchedRedirect = this.redirects.find(redirect => matchPath(location.pathname, redirect.from));
    if (matchedRedirect) {
      routeProvider.browserHistory.push(matchedRedirect.to);
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

  /**
   * Open points:
   *
   * - validate routes when adding route/redirect (LATER)
   * - tests
   * - doc and example
   */

  /**
   * Tests for:
   * - use the tests for documentation! have a similar (if not the same) documentation as the pathToRegex library
   * - whether the latest added route will be rendered, given there are multiple matches
   */

  addRoute = (path: string, component: (rp: RouteParameters) => JSX.Element) => {
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
    this.setCurrentComponentOrRedirect();
  };

  addRedirect = (newRedirect: H4Redirect) => {
    this.redirects.unshift(newRedirect);
    this.setCurrentComponentOrRedirect(); //check whether you can observe this
  };
}

export class MainRouter extends AppSingleton {
  @observable routers: Router[] = [];

  addRouter(router: Router) {
    this.routers.push(router);
  }

  RenderInstance = observer(() => {
    const routeProvider = this.getSingleton(RouteProvider);
    return (
      <HistoryContext.Provider
        value={{ history: routeProvider.browserHistory, location: routeProvider.location.pathname }}
      >
        {this.routers.map(router => (
          <router.RenderInstance />
        ))}
      </HistoryContext.Provider>
    );
  });
}
