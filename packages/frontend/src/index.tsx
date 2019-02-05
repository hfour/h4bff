import { AppSingleton } from '@h4bff/core';
import * as React from 'react';
import { Router, Route, RouteComponentProps } from 'react-router';
import { browserHistory } from './history'

export type H4Route = {
  path: string;
  component: (rp: RouteComponentProps<any, any>) => JSX.Element;
};

export type RP = RouteComponentProps<any, any>;

/**
 * Frontend router.
 */
export class H4Router extends AppSingleton {
  routes: Array<H4Route> = [];

  add(route: H4Route) {
    console.log('add route' , route.component.name)
    this.routes.push(route);
  }

  generateRouterJSX() {
    return (
      <Router history={browserHistory}>
        <Route path="/" component={(props: any) => props.children}>
          {this.routes.map(route => (
            <Route key={route.path} path={route.path} component={route.component} />
          ))}
        </Route>
      </Router>
    );
  }
}
