import { AppSingleton } from '@h4bff/core';
import * as React from 'react';
import { Router, Route, RouteComponentProps, browserHistory } from 'react-router';

export type H4Route = {
  path: string;
  component: (rp: RouteComponentProps<any, any>) => JSX.Element;
};

export type RP = RouteComponentProps<H4Route, any>;

/**
 * Frontend router.
 */
export class H4Router extends AppSingleton {
  routes: Array<H4Route> = [];

  add(route: H4Route) {
    this.routes.push(route);
  }

  generateRouterJSX() {
    return (
      <Router history={browserHistory}>
        <Route path="/" component={props => props.children}>
          {this.routes.map(route => (
            <Route key={route.path} path={route.path} component={route.component} />
          ))}
        </Route>
      </Router>
    );
  }
}
