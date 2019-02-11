import { AppSingleton, App } from '@h4bff/core';
import { createBrowserHistory, History, Location } from 'history';
import { observable, runInAction, reaction } from 'mobx';

/**
 * Frontend route provider. Listens to change of the location and updates it.
 */
export class RouteProvider extends AppSingleton {
  @observable browserHistory: History;
  @observable location: Location;

  constructor(app: App) {
    super(app);
    console.log('CONSTRUCTOR IN ROUTER PROVIDER');

    this.browserHistory = createBrowserHistory();
    this.location = this.browserHistory.location;

    this.browserHistory.listen(location => {
      console.log('Location change ', location.pathname);
      runInAction(() => (this.location = location));
    });

    reaction(() => this.location.pathname, pathname => console.log(' IN FIRST REACTION ', pathname));
  }
}
