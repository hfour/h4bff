import {
  ServiceContext,
  Locator,
  ConstructorOrFactory,
  PublicInterface,
  ServiceContextEvents,
} from './internal';

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
  private singletonLocator = new Locator(this, s => '__appSingleton' in s, {});
  private transientLocator = new Locator(this, s => '__baseTransient' in s, { isTransient: true });

  parentApp: App | null;

  constructor(opts: { parentApp?: App } = {}) {
    this.parentApp = opts.parentApp ? opts.parentApp : null;
    this.singletonLocator = new Locator(this, s => '__appSingleton' in s, {});
  }

  /**
   * @internal
   */
  serviceLocator = new Locator(this.createServiceContext(), s => '__baseService' in s, {});

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
   * Creates a new Transient instance of the specified class. The instance is constructed on every
   * createTransient request. If using a getter, be sure to use memoization, otherwise the transient
   * will be recreated on every call of the getter
   *
   * @param Klass the transient class or factory
   */
  createTransient<T>(Klass: ConstructorOrFactory<App, T>) {
    return this.transientLocator.get(Klass);
  }

  /**
   * Allows you to specify an alternative implementation for the
   * expected transient. Each time someone tries to instantiate the
   * specified class / fn, the override is used instead. The type of
   * the override must match that of the original class / fn.
   *
   * This method is typically useful in tests to test plugins in isolation by providing mock or
   * fake dependencies.
   */
  overrideTransient<T>(
    Klass: ConstructorOrFactory<App, T>,
    Klass2: ConstructorOrFactory<App, PublicInterface<T>>,
  ) {
    return this.transientLocator.override(Klass, Klass2);
  }

  /**
   * Clears any defined transient overrides.
   */
  clearTransientOverrides() {
    return this.transientLocator.clearOverrides();
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
