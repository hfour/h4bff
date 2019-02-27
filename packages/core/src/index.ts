type ClassFactory<U, T> = (u: U) => T;
type ClassConstructor<U, T> = { new (u: U): T };
export type ConstructorOrFactory<U, T> = ClassFactory<U, T> | ClassConstructor<U, T>;

export type PublicInterface<T> = { [K in keyof T]: T[K] };

/**
 * Represents an H4BFF application container.
 *
 * Containers are responsible for:
 * - initializing and storing singletons;
 * - creating and executing functions within service contexts;
 * - managing singleton overrides (useful for tests);
 *
 * Containers can have parents. When initializing singletons,
 * we check the parent, grand-parent container etc. to see if the singleton
 * is already initialized, so we can return that instance. If a parent
 * is not found, the singleton is initialized in the child container, *not*
 * in a parent container.
 */
export class AppContainer {
  singletonLocator: Locator<this>;
  parentContainer: AppContainer | null;

  constructor(opts: { parentContainer?: AppContainer } = {}) {
    this.parentContainer = opts.parentContainer ? opts.parentContainer : null;
    this.singletonLocator = new Locator(this, s => '__appSingleton' in s);
  }

  /**
   * @internal
   */
  serviceLocator = new Locator(this.createServiceContext(), s => '__baseService' in s);

  /**
   * Walks through parents and returns an existing singleton instance. Call
   * this method ONLY if you KNOW that the instance exists.
   */
  private getExistingSingleton<T>(Klass: ConstructorOrFactory<AppContainer, T>): T {
    if (this.hasOwnSingleton(Klass)) {
      return this.singletonLocator.get(Klass);
    } else {
      if (!this.parentContainer) {
        // this should not happen, because prior to calling this method,
        // we check if there's an instance.
        throw new Error('Finished searching through parents but couldnt find the singleton instance');
      }
      return this.parentContainer.getExistingSingleton(Klass);
    }
  }

  /**
   * Checks if this AppContainer instance has the given singleton initialized in itself.
   */
  private hasOwnSingleton<T>(Klass: ConstructorOrFactory<AppContainer, T>) {
    return this.singletonLocator.has(Klass);
  }

  /**
   * Checks if this or any of the parent apps has an instance of the
   * given singleton initialized.
   */
  private hasSingleton<T>(Klass: ConstructorOrFactory<AppContainer, T>): boolean {
    if (this.hasOwnSingleton(Klass)) {
      return true;
    } else {
      if (!this.parentContainer) {
        return false;
      } else {
        return this.parentContainer.hasSingleton(Klass);
      }
    }
  }

  /**
   * Returns an instance of the singleton, if it exists somewhere here or
   * in some of the parent containers. If it doesn't it's created in this container.
   */
  getSingleton<T>(Klass: ConstructorOrFactory<AppContainer, T>): T {
    if (this.hasSingleton(Klass)) {
      return this.getExistingSingleton(Klass);
    }
    return this.singletonLocator.get(Klass);
  }

  /**
   * Allows you to specify an alternative implementation for the
   * expected singleton. Each time someone tries to instantiate the
   * specified class / fn, the override is used instead. The type of
   * the override must match that of the original class / fn.
   */
  overrideSingleton<T>(
    Klass: ConstructorOrFactory<AppContainer, T>,
    Klass2: ConstructorOrFactory<AppContainer, PublicInterface<T>>,
  ) {
    return this.singletonLocator.override(Klass, Klass2);
  }

  /**
   * Allows you to specify an alternative implementation for the
   * expected service. Each time someone tries to instantiate the
   * specified class / fn, the override is used instead. The type of
   * the override must match that of the original class / fn.
   */
  overrideService<T>(
    Klass: ConstructorOrFactory<ServiceContext, T>,
    Klass2: ConstructorOrFactory<ServiceContext, PublicInterface<T>>,
  ) {
    return this.serviceLocator.override(Klass, Klass2);
  }

  /**
   * Loads the plugin, which forces its initialization.
   *
   * Use this when you want to initialize a class somewhere
   * specific in the hierarchy of apps, for example in
   * the parent container, to prevent it from being initalized
   * in a child later on.
   */
  load<T>(Klass: ConstructorOrFactory<AppContainer, T>): void {
    this.getSingleton(Klass); // force initialization;
    return;
  }

  /**
   * Override this method to load plugins in your container.
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
  createServiceContext() {
    return new ServiceContext(this);
  }

  /**
   * Creates a service context, executes the provided function and disposes
   * of the context afterwards. Disposal happens regardless of exceptions.
   */
  withServiceContext<T>(f: (createdCtx: ServiceContext) => PromiseLike<T>): PromiseLike<T> {
    let serviceContext = this.createServiceContext();
    let ctxEvents = this.getSingleton(ServiceContextEvents);
    let happyHandler = (res: T) => ctxEvents.disposeContext(serviceContext, null).then(() => res);
    let sadHandler = (error: Error) =>
      ctxEvents.disposeContext(serviceContext, error).then(() => {
        throw error;
      });
    try {
      return Promise.resolve(f(serviceContext)).then(happyHandler, sadHandler);
    } catch (e) {
      return sadHandler(e);
    }
  }

  /**
   * When instatiating singletons, child containers look in their parents
   * for already instantiated singletons, returning them if they exists.
   *
   * Services and the service context are not affected by parent / child
   * hierarchies.
   *
   * Use this when you want to initialize the same kind of a singleton
   * multiple times.
   */
  createChildContainer() {
    return new AppContainer({ parentContainer: this });
  }
}

/**
 * Derive from this class to create application singletons.
 *
 * Singletons are initialized only once per application container.
 * However, you can initialize different singletons of the same type in
 * child application containers.
 */
export class AppSingleton {
  protected static __appSingleton = true;

  constructor(protected container: AppContainer) {}

  /**
   * A proxy for `container.getSingleton(Klass)`.
   */
  getSingleton<T>(Klass: ConstructorOrFactory<AppContainer, T>): T {
    return this.container.getSingleton(Klass);
  }
}

/**
 * Represents a transient context, that's usually created when an
 * HTTP request comes, a new page is created or on similar events
 * on which you want to create and later destroy some services.
 *
 * For example, if you want all services to exectute their queries
 * within a single transaction, you'd create a service context and
 * initialize a transaction inside it.
 *
 * Another example is handling access to the request that triggered
 * the creation of the service context. You'll want to initialize
 * a Request service on the service context which will get passed
 * around.
 *
 * See `ServiceContextEvents` for more info on doing things in
 * response to the creation / destruction of service contexes.
 */
export class ServiceContext {
  private _locator: Locator<ServiceContext> | null = null;

  get locator() {
    if (this._locator == null) {
      this._locator = this.container.serviceLocator.withNewContext(this);
    }
    return this._locator;
  }

  constructor(private container: AppContainer) {}

  /**
   * Initializes the class within the service context (itself.)
   *
   * If the service is already initialized, it returns the instance.
   */
  getService<T extends BaseService>(SvcClass: ConstructorOrFactory<ServiceContext, T>): T {
    return this.locator.get(SvcClass);
  }

  /**
   * A proxy for `container.getSingleton(Klass)`.
   */
  getSingleton<T extends AppSingleton>(SingletonClass: ConstructorOrFactory<AppContainer, T>): T {
    return this.container.getSingleton(SingletonClass);
  }
}

export type ContextListener = (serviceCtx: ServiceContext, error: Error | null) => PromiseLike<void>;

/**
 * Handles events related to context creation, destruction etc.
 *
 * See `onContextDisposed` for more details.
 */
export class ServiceContextEvents extends AppSingleton {
  private listeners: ContextListener[] = [];

  /**
   * Registers a function that will be called every time a service
   * context is getting destroyed.
   *
   * For example, let's say we create a context on the backend
   * each time a request comes in. Before we return a response,
   * we want to close the DB transaction. What you'd do is:
   *
   * `container.getSingleton(ServiceContextEvents).onContextDisposed(ctx => { ... ctx.getService(Txn).rm() })`
   *
   * Use this when you want to react to the destruction of any
   * service context.
   */
  onContextDisposed(listener: ContextListener) {
    this.listeners.push(listener);
  }

  /**
   * Triggers the destruction of the passed service context.
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
 * which have only one instance within an AppContainer.
 *
 * Examples of classes that should derive from `BaseService`:
 * * Request: holds a reference to the HTTP request that triggered
 *   the service context creation
 * * Transaction: a single transaction that's shared between
 *   services that operate througout the duration of a single
 *   request.
 * * UserInfo: information about the current user (known through
 *   req.session.id)
 * etc.
 */
export class BaseService {
  protected static __baseService = true;
  static _factory: any;
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
   * Proxy for `container.getSingleton(Klass)`.
   */
  getSingleton<T extends AppSingleton>(SingletonClass: { new (sc: AppContainer): T }): T {
    return this.context.getSingleton(SingletonClass);
  }
}

/**
 * Mostly for internal use.
 *
 * Used for locating instances of classes / factory functions,
 * and for instantiating them if they don't exist.
 *
 * Provides overriding functionality (used for mocks in tests.)
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
      console.warn(`Warning: by overriding ${f.name}, you will be shadowing an already instantiated class.`);
    }
    this.overrides.set(f, g);
  }

  withNewContext(ctx: Context) {
    return new Locator(ctx, this.isClass, { overrides: this.overrides });
  }
}
