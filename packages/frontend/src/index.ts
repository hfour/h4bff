import { AppSingleton, ServiceContext } from '@h4bff/core';
import { createBrowserHistory } from 'history';
import { observable, computed } from 'mobx';
import * as React from 'react';
import * as pathToRegexp from 'path-to-regexp';

export class Location extends AppSingleton {
  private h = createBrowserHistory();
  @observable path = '/';
  @observable search = '';
  @observable hash = '';

  private _unlisten = this.h.listen(location => {
    this.path = location.pathname;
    this.search = location.search;
    this.hash = location.hash;
  });
}

type Params = { [key: string]: string };
export type PageProps = { context: ServiceContext; params: Params };
export class Page extends React.Component<PageProps> {}

type PageConstructor = { new (props: PageProps): Page };

class Error404 extends Page {
  render() {
    return null;
  }
}

export interface Route {
  match: (path: string) => null | Params;
  component: PageConstructor;
}

export class MobxRouter extends AppSingleton {
  private location = this.getSingleton(Location);

  @observable private routes: Array<Route> = [];

  @observable private noMatch: { new (props: PageProps): Page } = Error404;

  @computed get matchingRoute() {
    for (let r of this.routes) if (r.match(this.location.path) != null) return r;
  }

  @computed.struct get params() {
    if (!this.matchingRoute) return {};
    return this.matchingRoute.match(this.location.path); /* deconstructs into a params object */
  }

  private oldPage: React.Component<PageProps> | null = null;

  @computed get currentPage() {
    if (this.oldPage && this.oldPage.componentWillUnmount) {
      this.oldPage.componentWillUnmount();
    }
    let context = this.app.createServiceContext();
    let params = this.params;
    if (params === null) throw new Error('This should never be the case, the route wont match');

    if (!this.matchingRoute) return (this.oldPage = new this.noMatch({ context, params }));
    return (this.oldPage = new this.matchingRoute.component({ context, params }));
  }

  add(path: string, component: PageConstructor) {
    let keys: pathToRegexp.Key[] = [];
    let reg = pathToRegexp(path, keys);
    let match = (path: string) => {
      let r = path.match(reg);
      if (r === null) return r;
      let params: Params = {};
      for (let k = 0; k < keys.length; ++k) {
        params[keys[k].name] = r[k + 1];
      }
      return params;
    };
    this.routes.push({ match, component });
  }

  set404(component: PageConstructor) {
    this.noMatch = component;
  }

  render() {
    return this.currentPage.render();
  }
}
