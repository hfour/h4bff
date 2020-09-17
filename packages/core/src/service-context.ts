import { Locator, App, BaseService, ConstructorOrFactory, AppSingleton } from './internal';
import * as Promise from 'bluebird';

/**
 * Represents a transient context. On the backend that's usually created for every individual
 * HTTP request. On the frontend a transient request is created when the router route changes -
 * when the user navigates to a different page.
 *
 * @remarks
 *
 * A service context is typically only provided via the safe APIs, for example
 * {@link App.withServiceContext | App.withServiceContext}. Once the async function passed to this
 * method finishes, the context is fully disposed automatically
 *
 * If your service context initializes resources, see
 * {@link ServiceContextEvents | ServiceContextEvents} for more info on doing cleanup when a
 * context goes away.
 *
 * @public
 */
export class ServiceContext {
  private _locator: Locator<ServiceContext> | null = null;

  private get locator() {
    if (this._locator == null) {
      this._locator = this.app.serviceLocator.withNewContext(this);
    }
    return this._locator;
  }

  constructor(private app: App) {}

  /**
   * Initializes the class within the service context (itself.)
   *
   * If the service is already initialized, it returns the instance.
   */
  getService<T extends BaseService>(SvcClass: ConstructorOrFactory<ServiceContext, T>): T {
    return this.locator.get(SvcClass);
  }

  /**
   * A proxy for `app.getSingleton(Klass)`.
   */
  getSingleton<T>(SingletonClass: ConstructorOrFactory<App, T>): T {
    return this.app.getSingleton(SingletonClass);
  }
}

type ContextListener = (serviceCtx: ServiceContext, error: Error | null) => PromiseLike<void>;

/**
 * Handles events related to context creation, destruction etc.
 *
 * See {@link ServiceContextEvents.onContextDisposed | onContextDisposed} for more details.
 *
 * @public
 */
export class ServiceContextEvents extends AppSingleton {
  private listeners: ContextListener[] = [];

  /**
   * Registers a function that will be called every time a service
   * context is getting destroyed.
   *
   * Use this when you want to react to the destruction of any
   * service context.
   *
   * @param listener - A function that receives the context and returns a promise when the event completes.
   *
   * @example
   * Let's say we create a context on the backend
   * each time a request comes in. Before we return a response,
   * we want to close the DB transaction. What we can do is:
   *
   * ```typescript
   * app.getSingleton(ServiceContextEvents).onContextDisposed(ctx => {
   *   ctx.getService(Txn).dispose()
   * })
   * ```
   */
  onContextDisposed(listener: ContextListener) {
    this.listeners.push(listener);
  }

  /**
   * Triggers the destruction of the passed service context.
   * @internal
   */
  disposeContext: ContextListener = (serviceCtx, err) => {
    let listenersResults = this.listeners.map(l =>
      Promise.resolve().then(() => l(serviceCtx, err)),
    );

    // Ideally we will switch to allSettled when we move away from bluebird
    let listenersWait = Promise.all(listenersResults.map(r => r.catch(() => {})));
    let listenersFirstErrorOrNothing = Promise.all(listenersResults).then(() => {});

    return listenersWait.then(() => listenersFirstErrorOrNothing);
  };
}
