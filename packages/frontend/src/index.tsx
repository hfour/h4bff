import { AppSingleton } from '@h4bff/core';
import * as React from 'react';
import { Router, Route, RouteComponentProps, Switch } from 'react-router';
import { browserHistory } from './history';

export type H4Route = {
  path: string;
  component: (rp: RouteComponentProps<any, any>) => JSX.Element;
};

export type H4Redirect = {
  //maybe something is missing, except for "from" and "to", check with react-router
  from: string;
  to: string;
};

export type RP = RouteComponentProps<any, any>;

/**
 * Frontend router.
 */
export class H4Router extends AppSingleton {
  routes: Array<H4Route> = [];

  add(route: H4Route) {
    console.log('add route', route.component.name);
    this.routes.push(route);
  }

  generateRouterJSX() {
    console.log('GENERATING ROUTER JSX');
    return (
      <Router history={browserHistory}>
        <Route path="/">
          <Switch>
            {this.routes.map(route => (
              <Route key={route.path} path={route.path} component={route.component} />
            ))}
          </Switch>
        </Route>
      </Router>
    );
  }
}

export * from './routeProvider';
export * from './router';
export * from './link';
