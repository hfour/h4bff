type ClassFactory<U, T> = (u: U) => T;
type ClassConstructor<U, T> = { new (u: U): T };
export type ConstructorOrFactory<U, T> = ClassFactory<U, T> | ClassConstructor<U, T>;

export type PublicInterface<T> = { [K in keyof T]: T[K] };

export class App {
  private singletonLocator: Locator<this>;

  constructor(singletonLocator?: Locator<any>) {
    this.singletonLocator = singletonLocator || new Locator(this, s => '__appSingleton' in s);
  }

  /**
   * @internal
   */
  serviceLocator = new Locator(this.createServiceContext(), s => '__baseService' in s);

  getSingleton<T>(Klass: ConstructorOrFactory<App, T>): T {
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

  load<T>(Klass: ConstructorOrFactory<App, T>) {
    this.singletonLocator.get(Klass);
  }

  loadPlugins() {
    throw new Error('Override this method to load plugins');
  }

  createServiceContext() {
    return new ServiceContext(this);
  }

  createSubApp() {
    let singletonLocator = new Locator(this, s => '__appSingleton' in s, { parent: this.singletonLocator });
    return new App(singletonLocator);
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
  private parent: Locator<Context> | null = null;
  private overrides: Map<Function, Function> = new Map();

  constructor(
    private arg: Context,
    private isClass: (v: ConstructorOrFactory<Context, any>) => boolean,
    options?: {
      overrides?: Map<Function, Function>;
      parent?: Locator<Context>;
    },
  ) {
    options = options || {};
    this.parent = options.parent || this.parent;
    this.overrides = options.overrides || this.overrides;
  }

  private isClassTG<T>(v: ConstructorOrFactory<Context, T>): v is ClassConstructor<Context, T> {
    return this.isClass(v);
  }

  private instantiate<T>(f: ConstructorOrFactory<Context, T>) {
    if (this.isClassTG(f)) return new f(this.arg);
    else return f(this.arg);
  }

  private existOnParent<T>(f: ConstructorOrFactory<Context, T>): boolean {
    if (this.parent) {
      return this.parent.instances.has(f) || this.parent.existOnParent(f);
    }
    return false;
  }

  private getFromParent<T>(f: ConstructorOrFactory<Context, T>): T {
    if (this.parent) {
      if (this.parent.instances.has(f)) {
        return this.parent.instances.get(f);
      } else {
        return this.parent.getFromParent(f);
      }
    }
    // we are at the root, but no component is found
    throw Error('There is no parent locator to look into.');
  }

  get<T>(f: ConstructorOrFactory<Context, T>): T {
    if (this.overrides.has(f)) {
      f = this.overrides.get(f) as any;
    }
    if (!this.instances.has(f)) {
      if (this.existOnParent(f)) {
        return this.getFromParent(f);
      }
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

export class AppSingleton {
  protected static __appSingleton = true;

  constructor(protected app: App) {}

  getSingleton<T>(Klass: ConstructorOrFactory<App, T>): T {
    return this.app.getSingleton(Klass);
  }
}
