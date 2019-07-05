import { ServiceContext, ConstructorOrFactory, App } from './internal';

/**
 * Derive from this class to create H4BFF services.
 *
 * Services are classes that are instantiated and operate
 * within an "isolated" service context, and are instantiated
 * separately within each context, as opposed to singletons
 * which have only one instance within an App.
 *
 * @remarks
 *
 * Examples of classes that should derive from `BaseService`:
 *
 * * Request: holds a reference to the HTTP request that triggered
 *   the service context creation
 *
 * * Transaction: a single transaction that's shared between
 *   services that operate throughout the duration of a single
 *   request.
 *
 * * UserInfo: information about the current user (known through
 *   req.session.id)
 *
 *
 * @public
 */
export class BaseService {
  /**
   * @internal
   */
  protected static __baseService = true;
  /**
   * @internal
   */
  static _factory: any;
  /**
   * @internal
   */
  static get factory() {
    if (!this._factory) this._factory = (serviceCtx: ServiceContext) => new this(serviceCtx);
    return this._factory;
  }

  constructor(protected context: ServiceContext) {}

  /**
   * Proxy for `serviceContext.getService(Klass)`.
   */
  getService<T extends BaseService>(SvcClass: { new (sc: ServiceContext): T }): T {
    return this.context.getService(SvcClass);
  }

  /**
   * Proxy for `app.getSingleton(Klass)`.
   */
  getSingleton<T>(SingletonClass: ConstructorOrFactory<App, T>): T {
    return this.context.getSingleton(SingletonClass);
  }
}
