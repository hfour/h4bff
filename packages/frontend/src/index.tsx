import { AppSingleton } from '@h4bff/core';
import * as React from 'react';
import { Router, Route, RouteComponentProps, browserHistory } from 'react-router';

export type H4Route = {
  path: string;
  component: (rp: RouteComponentProps<any, any>) => JSX.Element;
};

export type RP = RouteComponentProps<H4Route, any>;

export function RouteWithSubRoutes(route: H4Route) {
  return (
    <Route
      key={route.path}
      path={route.path}
      component={props => (
        // pass the sub-routes down to keep nesting
        <route.component {...props} />
      )}
    />
  );
}

/**
 * Frontend router.
 */
export class H4Router extends AppSingleton {
  routes: Array<H4Route> = [];

  add(route: H4Route) {
    this.routes.push(route);
  }

  generateRouterJSX() {
    let routesJsx = this.routes.map(RouteWithSubRoutes);
    return <Router history={browserHistory}>{routesJsx}</Router>;
  }
}
