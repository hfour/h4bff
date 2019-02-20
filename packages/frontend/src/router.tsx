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
 * Frontend route provider. Listens to change of the location and updates it.
 */
export class Router extends AppSingleton {
  @observable private currentComponentJSX: UIElement = null;
  @observable private routeParams: RouteParameters = {};
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
  }

  Instance = observer(() => {
    return this.currentComponentJSX ? this.currentComponentJSX(this.routeParams) : null;
  });

  /**
   * Open points;
   * - check for duplicate routes?  -> unshift (proposed)
   * - validate routes when adding route/redirect
   * - include it in UI kit  -> UI kit da ima provider
   * - tests
   * - doc and example
   */

  addRoute = (path: string, component: (rp: RouteParameters) => JSX.Element) => {
    //TODO, Emil: validate route - whether it starts with "/", and check for colisions with other routes in the same lvl

    //pathToRegex doesnt handle '/*' for mathing anything, so we have to replace it with a param with 0 or more occurences.
    const newPath = path.replace('/*', '/:placeholderForMathingAnyRoute*');
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
    this.routes.push({ match, component });
    this.setCurrentComponentOrRedirect();
  };

  addRedirect(newRedirect: H4Redirect) {
    //TODO, Emil: validate route - whether it starts with "/", and check for colisions with other routes in the same lvl
    this.redirects.push(newRedirect);
    this.setCurrentComponentOrRedirect(); //check whether you can observe this
  }
}

interface MainRouterProps {
  app: App;
}

@observer
export class MainRouter extends React.Component<MainRouterProps, {}> {
  render() {
    const routeProvider = this.props.app.getSingleton(RouteProvider);
    return (
      <HistoryContext.Provider
        value={{ history: routeProvider.browserHistory, location: routeProvider.location.pathname }}
      >
        {this.props.children}
      </HistoryContext.Provider>
    );
  }
}
