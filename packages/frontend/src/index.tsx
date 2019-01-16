import { AppSingleton } from '@h4bff/core';
import * as React from 'react';
import { Router, Route, RouteComponentProps, browserHistory } from 'react-router';

export type H4Route = {
  path: string;
  component: (rp: RouteComponentProps<any, any>) => JSX.Element;
  h4Routes?: Array<H4Route>;
};

export function RouteWithSubRoutes(props: { route: H4Route }) {
  console.log('tochak', props.route);
  return (
    <Route
      path={props.route.path}
      component={props => (
        // pass the sub-routes down to keep nesting
        <props.route.component {...props} h4Routes={props.route.h4Routes} />
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
    console.log(this.routes);
    return (
      <Router history={browserHistory}>
        {this.routes.map((route, i) => {
          console.log(route);
          return <RouteWithSubRoutes key={i} route={route} />;
        })}
      </Router>
    );
  }
}
