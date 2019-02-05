type ClassFactory<U, T> = (u: U) => T;
type ClassConstructor<U, T> = { new (u: U): T };
export type ConstructorOrFactory<U, T> = ClassFactory<U, T> | ClassConstructor<U, T>;

export type PublicInterface<T> = { [K in keyof T]: T[K] };

export class App {
  singletonLocator: Locator<this>;
  parentApp: App | null;

  constructor(opts: { parentApp?: App } = {}) {
    this.parentApp = opts.parentApp ? opts.parentApp : null;
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
  private getExistingSingleton<T>(Klass: ConstructorOrFactory<App, T>): T {
    if (this.hasOwnSingleton(Klass)) {
      return this.singletonLocator.get(Klass);
    } else {
      if (!this.parentApp) {
        // this should not happen, because prior to calling this method,
        // we check if there's an instance.
        throw new Error('Finished searching through parents but couldnt find the singleton instance');
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
   * given singleton initialized.
   */
  private hasSingleton<T>(Klass: ConstructorOrFactory<App, T>): boolean {
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
   */
  getSingleton<T>(Klass: ConstructorOrFactory<App, T>): T {
    if (this.hasSingleton(Klass)) {
      return this.getExistingSingleton(Klass);
    }
    return this.singletonLocator.get(Klass);
  }

  overrideSingleton<T>(Klass: ConstructorOrFactory<App, T>, Klass2: ConstructorOrFactory<App, PublicInterface<T>>) {
    return this.singletonLocator.override(Klass, Klass2);
  }

  overrideService<T>(
    Klass: ConstructorOrFactory<ServiceContext, T>,
    Klass2: ConstructorOrFactory<ServiceContext, PublicInterface<T>>,
  ) {
    return this.serviceLocator.override(Klass, Klass2);
  }

  /**
   * Loads the plugin, which forces its initialization.
   */
  load<T>(Klass: ConstructorOrFactory<App, T>): void {
    this.getSingleton(Klass); // force initialization;
    return;
  }

  loadPlugins() {
    throw new Error('Override this method to load plugins');
  }

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
    return Promise.resolve().then(
      () => f(serviceContext).then(res => ctxEvents.disposeContext(serviceContext, null).then(() => res)),
      error =>
        ctxEvents.disposeContext(serviceContext, error).then(() => {
          throw error;
        }),
    );
  }

  /**
   * When instatiating singletons, child applications look in their parents
   * for already instantiated singletons, returning them if they exists.
   *
   * Services and the service context are not affected by parent / child
   * hierarchies.
   */
  createChildApp() {
    return new App({ parentApp: this });
  }
}

export class AppSingleton {
  protected static __appSingleton = true;

  constructor(protected app: App) {}

  getSingleton<T>(Klass: ConstructorOrFactory<App, T>): T {
    return this.app.getSingleton(Klass);
  }
}

export class ServiceContext {
  private _locator: Locator<ServiceContext> | null = null;

  get locator() {
    if (this._locator == null) {
      this._locator = this.app.serviceLocator.withNewContext(this);
    }
    return this._locator;
  }

  constructor(private app: App) {}

  getService<T extends BaseService>(SvcClass: ConstructorOrFactory<ServiceContext, T>): T {
    return this.locator.get(SvcClass);
  }

  getSingleton<T extends AppSingleton>(SingletonClass: ConstructorOrFactory<App, T>): T {
    return this.app.getSingleton(SingletonClass);
  }
}

export type ContextListener = (sCtx: ServiceContext, error: Error | null) => PromiseLike<void>;

export class ServiceContextEvents extends AppSingleton {
  private listeners: ContextListener[] = [];

  onContextDisposed(listener: ContextListener) {
    this.listeners.push(listener);
  }

  disposeContext: ContextListener = (sCtx, err) => {
    return Promise.all(this.listeners.map(l => l(sCtx, err))).then(() => {});
  };
}

export class BaseService {
  protected static __baseService = true;
  static _factory: any;
  static get factory() {
    if (!this._factory) this._factory = (sc: ServiceContext) => new this(sc);
    return this._factory;
  }

  constructor(protected context: ServiceContext) {}

  getService<T extends BaseService>(SvcClass: { new (sc: ServiceContext): T }): T {
    return this.context.getService(SvcClass);
  }

  getSingleton<T extends AppSingleton>(SingletonClass: { new (sc: App): T }): T {
    return this.context.getSingleton(SingletonClass);
  }
}

export class Locator<Context> {
  private instances: Map<Function, any> = new Map();
  private overrides: Map<Function, Function> = new Map();

  constructor(
    private arg: Context,
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
    if (this.isClassTG(f)) return new f(this.arg);
    else return f(this.arg);
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

  set<T>(f: ConstructorOrFactory<Context, T>) {
    if (this.overrides.has(f)) f = this.overrides.get(f) as any;
    if (this.instances.has(f)) throw new Error('Singleton is already set');
    this.instances.set(f, this.instantiate(f));
    return this.instances.get(f);
  }

  override<T>(f: ConstructorOrFactory<Context, T>, g: ConstructorOrFactory<Context, T>) {
    this.overrides.set(f, g);
  }

  withNewContext(ctx: Context) {
    return new Locator(ctx, this.isClass, { overrides: this.overrides });
  }
}
