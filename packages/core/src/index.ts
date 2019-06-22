type ClassFactory<U, T> = (u: U) => T;
type ClassConstructor<U, T> = { new (u: U): T };

/**
 * @internal
 */
export type ConstructorOrFactory<U, T> = ClassFactory<U, T> | ClassConstructor<U, T>;

/**
 * @internal
 */
export type PublicInterface<T> = { [K in keyof T]: T[K] };

/**
 * Represents an H4BFF application, the central hub of h4bff. Its the class that loads and
 * initializes all the plugins, storing instances of their singletons in the singleton locator, as
 * well as creating new service contexts which keep per-request service locators.
 *
 * @remarks
 *
 * When creating a new backend or frontend application, typically you would inherit from this
 * class, adding a few methods such as `start` and `loadPlugins`
 *
 * You can also use this class in your plugin tests to create a fake, controlled application
 * environment. Services and singletons in this environment can be overridden using the
 * overrideService and overrideSingleton methods, in order to more easily test plugins in
 * isolation.
 *
 * Applications are hierarchical. An app can contain multiple child applications. This is useful
 * if for example you want to have two RPC endpoints, internal and external - but you want both
 * apps to share a single database access layer. You would load the database access layer in the
 * parent, while the individual routes get set up in the child apps created with
 * `app.createChildApp`
 *
 * The App class does not currently propose any specific lifecycle. A typical application would
 * probably have a configuration method and a loadPlugins method.
 *
 * The configuration method will get any configuration singletons and set up any necessary values
 * in them. For example, a configuration singleton of a backend plugin might specify the needed
 * environment variables.
 *
 * Then, the `loadPlugins` method would actually load all the plugins, which should setup router
 * routes, event hooks, RPC endpoints (for backend apps) and so on.
 *
 * @public
 */
export class App {
  private singletonLocator: Locator<this>;
  private providedSingletons: WeakMap<ConstructorOrFactory<App, any>, boolean> = new WeakMap();
  parentApp: App | null;

  constructor(opts: { parentApp?: App } = {}) {
    this.parentApp = opts.parentApp ? opts.parentApp : null;
    this.singletonLocator = new Locator(this, s => '__appSingleton' in s);
    this.provideSingleton(ServiceContextEvents); // otherwise, withServiceContext fails.
  }

  /**
   * @internal
   */
  serviceLocator = new Locator(this.createServiceContext(), s => '__baseService' in s);

  /**
   * Walks through parents and returns an existing singleton instance. Call
   * this method ONLY if you KNOW that the instance exists.
   */
  private getExistingSingleton<T>(Klass: ConstructorOrFactory<App, T>): T {
    if (this.hasOwnSingleton(Klass)) {
      return this.singletonLocator.get(Klass);
    } else {
      if (!this.parentApp) {
        // this should not happen, because prior to calling this method,
        // we check if there's an instance.
        throw new Error(
          'Finished searching through parents but couldnt find the singleton instance',
        );
      }
      return this.parentApp.getExistingSingleton(Klass);
    }
  }

  /**
   * Checks if this App instance has the given singleton initialized
   * in itself.
   */
  private hasOwnSingleton<T>(Klass: ConstructorOrFactory<App, T>) {
    return this.singletonLocator.has(Klass);
  }

  /**
   * Checks if this or any of the parent apps has an instance of the
   * given singleton initialized. Plugins can use this to check if their configuration
   * singletons have been loaded before they have.
   */
  hasSingleton<T>(Klass: ConstructorOrFactory<App, T>): boolean {
    if (this.hasOwnSingleton(Klass)) {
      return true;
    } else {
      if (!this.parentApp) {
        return false;
      } else {
        return this.parentApp.hasSingleton(Klass);
      }
    }
  }

  /**
   * Registers a singleton as "provided". It's informing the application that a plugin
   * agreed to expose that singleton.
   *
   * Calls to app.getSingleton(UnprovidedService) will fail with an error.
   *
   * Also see: `App#requireSingleton`
   */
  provideSingleton<T>(Klass: ConstructorOrFactory<App, T>): void {
    if (this.providedSingletons.has(Klass)) {
      throw new Error(`The singleton ${Klass.name} is already provided.`);
    }
    this.providedSingletons.set(Klass, true);
  }

  private isSingletonProvided<T>(Klass: ConstructorOrFactory<App, T>): boolean {
    if (this.providedSingletons.has(Klass)) {
      return true;
    } else if (this.parentApp) {
      return this.parentApp.isSingletonProvided(Klass);
    } else {
      return false;
    }
  }

  requireSingleton<T>(Klass: ConstructorOrFactory<App, T>): void {
    if (!this.providedSingletons.has(Klass)) {
      throw new Error(`The singleton ${Klass} is required, but wasnt provided.`);
    }
  }

  /**
   * Returns an instance of the singleton, if it exists somewhere here or
   * in some of the parent apps. If it doesn't it's created in this app.
   *
   * This method can also be used to initialize a class somewhere
   * specific in the hierarchy of apps, for example in
   * the parent app, to prevent it from being initialized
   * in a child later on.
   */
  getSingleton<T>(Klass: ConstructorOrFactory<App, T>): T {
    if (this.hasSingleton(Klass)) {
      return this.getExistingSingleton(Klass);
    }
    if (!this.isSingletonProvided(Klass)) {
      throw new Error(`Singleton ${Klass.name} wasnt provided`);
      // console.warn(`The singleton ${Klass} was constructed, but wasn't provided beforehand.`);
      // console.warn(`Please provide it explicitly using "App#provideSingleton(${Klass})".`);
      // console.warn('In the future, this will be an error.');
    }
    return this.singletonLocator.get(Klass);
  }

  /**
   * Allows you to specify an alternative implementation for the
   * expected singleton. Each time someone tries to instantiate the
   * specified class / fn, the override is used instead. The type of
   * the override must match that of the original class / fn.
   *
   * This method is typically useful in tests to test plugins in isolation by providing mock or
   * fake dependencies.
   */
  overrideSingleton<T>(
    Klass: ConstructorOrFactory<App, T>,
    Klass2: ConstructorOrFactory<App, PublicInterface<T>>,
  ) {
    return this.singletonLocator.override(Klass, Klass2);
  }

  /**
   * Clears any defined singleton overrides.
   */
  clearSingletonOverrides() {
    return this.singletonLocator.clearOverrides();
  }

  /**
   * Allows you to specify an alternative implementation for the
   * expected service. Each time someone tries to instantiate the
   * specified class / fn, the override is used instead. The type of
   * the override must match that of the original class / fn.
   *
   * This method is typically useful in tests to test plugins in isolation by providing mock or
   * fake dependencies.
   */
  overrideService<T>(
    Klass: ConstructorOrFactory<ServiceContext, T>,
    Klass2: ConstructorOrFactory<ServiceContext, PublicInterface<T>>,
  ) {
    return this.serviceLocator.override(Klass, Klass2);
  }

  /**
   * Clears any defined service overrides.
   */
  clearServiceOverrides() {
    return this.serviceLocator.clearOverrides();
  }

  /**
   * Loads the plugin, which forces its initialization.
   *
   * While singleton classes are typically side effect free and can be instantiated lazily when
   * first requested, plugins have side-effects, such as adding router routes, adding RPC endpoints
   * or setting up event listeners. The load method is therefore used to load those plugins.
   */
  load<T>(Klass: ConstructorOrFactory<App, T>): void {
    this.getSingleton(Klass); // force initialization;
    return;
  }

  /**
   * Override this method to load plugins in your app.
   *
   * TODO: describe why it's important to load plugins
   * when configuring an application; also how it differs
   * from starting the application -- the other kind of
   * side-effects.
   */
  loadPlugins() {
    throw new Error('Override this method to load plugins');
  }

  /**
   * Creates a service context.
   *
   * See the documentation for `ServiceContext` for more details.
   */
  private createServiceContext() {
    return new ServiceContext(this);
  }

  /**
   * Creates a service context, executes the provided function and disposes
   * of the context afterwards. Disposal happens regardless of exceptions. See
   * {@link ServiceContext | ServiceContext} for more info on what a service context is,
   * and {@link ServiceContextEvents | ServiceContextEvents} for more info on disposal.
   *
   */
  withServiceContext<T>(f: (createdCtx: ServiceContext) => PromiseLike<T>) {
    let serviceContext = this.createServiceContext();
    let ctxEvents = this.getSingleton(ServiceContextEvents);
    let happyHandler = (res: T) => ctxEvents.disposeContext(serviceContext, null).then(() => res);
    let sadHandler = (error: Error) =>
      ctxEvents.disposeContext(serviceContext, error).then(() => {
        throw error;
      });
    return Promise.resolve(serviceContext)
      .then(f)
      .then(happyHandler, sadHandler);
  }

  /**
   * When instantiating singletons, child applications look in their parents
   * for already instantiated singletons, returning them if they exists.
   *
   * Services and the service context are not affected by parent / child
   * hierarchies.
   *
   * Use this when you want to initialize the same kind of a singleton
   * multiple times.
   */
  createChildApp() {
    return new App({ parentApp: this });
  }
}

/**
 * Derive from this class to create application singletons.
 *
 * Singletons are initialized only once per application, although
 * you can initialize different singletons of the same type in
 * child applications.
 *
 * @public
 */
export class AppSingleton {
  protected static __appSingleton = true;

  constructor(protected app: App) {}

  /**
   * A proxy for {@link App.getSingleton | `app.getSingleton(Klass)`}
   */
  getSingleton<T>(Klass: ConstructorOrFactory<App, T>): T {
    return this.app.getSingleton(Klass);
  }
}

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

  requireSingleton<T>(SingletonClass: ConstructorOrFactory<App, T>) {
    return this.app.requireSingleton(SingletonClass);
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
    return Promise.all(this.listeners.map(l => l(serviceCtx, err))).then(() => {});
  };
}

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

/**
 * The dependency injection locator of h4bff. One is instantiated for each app, as well as for
 * each service context (per request).
 *
 * Normally you wouldn't use the locator directly, instead convenience methods getService and
 * getSingleton are provided from within services, service context singletons and apps.
 *
 * The locator also controls overrides, but those are also typically configured through the app
 * itself instead of via the locator.
 *
 * @internal
 */
export class Locator<Context> {
  private instances: Map<Function, any> = new Map();
  private overrides: Map<Function, Function> = new Map();
  constructor(
    private locatorCtx: Context,
    private isClass: (v: ConstructorOrFactory<Context, any>) => boolean,
    options?: {
      overrides?: Map<Function, Function>;
    },
  ) {
    options = options || {};
    this.overrides = options.overrides || this.overrides;
  }

  private isClassTG<T>(v: ConstructorOrFactory<Context, T>): v is ClassConstructor<Context, T> {
    return this.isClass(v);
  }

  private instantiate<T>(f: ConstructorOrFactory<Context, T>) {
    if (this.isClassTG(f)) return new f(this.locatorCtx);
    else return f(this.locatorCtx);
  }

  has<T>(f: ConstructorOrFactory<Context, T>): boolean {
    return this.instances.has(f) || this.overrides.has(f);
  }

  get<T>(f: ConstructorOrFactory<Context, T>): T {
    if (this.overrides.has(f)) {
      f = this.overrides.get(f) as any;
    }
    if (!this.instances.has(f)) {
      this.instances.set(f, this.instantiate(f));
    }
    return this.instances.get(f) as T;
  }

  override<T>(f: ConstructorOrFactory<Context, T>, g: ConstructorOrFactory<Context, T>) {
    if (this.instances.has(f)) {
      console.warn(
        `Warning: by overriding ${f.name}, you will be shadowing an already instantiated class.`,
      );
    }
    this.overrides.set(f, g);
  }

  withNewContext(ctx: Context) {
    return new Locator(ctx, this.isClass, { overrides: this.overrides });
  }

  clearOverrides() {
    this.overrides = new Map();
  }
}
