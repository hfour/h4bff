import { AppSingleton, AppContainer } from '@h4bff/core';
import { createBrowserHistory, History, Location } from 'history';
import { observable, runInAction } from 'mobx';

/**
 * Frontend route provider. Listens to change of the location and updates it.
 */
export class RouteProvider extends AppSingleton {
  public readonly browserHistory: History;
  @observable location: Location;

  constructor(app: AppContainer) {
    super(app);

    this.browserHistory = createBrowserHistory();
    this.location = this.browserHistory.location;

    this.browserHistory.listen(location => runInAction(() => (this.location = location)));
  }
}
