import { ConstructorOrFactory, ClassConstructor } from './internal';

export type Instantiator<Context> = <T>(f: ConstructorOrFactory<Context, T>) => T;

export type Interceptor<Context> = (i: Instantiator<Context>) => Instantiator<Context>;

function baseInstantiator<Context>(opts: {
  isClass: (v: ConstructorOrFactory<Context, any>) => boolean;
  locatorCtx: Context;
}): Instantiator<Context> {
  let isClassG = opts.isClass as ((
    v: ConstructorOrFactory<Context, any>,
  ) => v is ClassConstructor<Context, any>);

  return f => {
    if (isClassG(f)) return new f(opts.locatorCtx);
    else return f(opts.locatorCtx);
  };
}

function cachingInterceptor<Context>(
  instances: Map<Function, any> = new Map(),
): Interceptor<Context> {
  return instantiator => f => {
    if (!instances.has(f)) {
      instances.set(f, instantiator(f));
    }
    return instances.get(f);
  };
}

function overrideInterceptor<Context>(
  overrides: Map<Function, Function> = new Map(),
): Interceptor<Context> {
  return instantiator => f => {
    if (overrides.has(f)) {
      f = overrides.get(f) as any;
    }
    return instantiator(f);
  };
}

export class Locator<Context> {
  private instances: Map<Function, any> = new Map();
  private overrides: Map<Function, Function> = new Map();
  private interceptors: Interceptor<Context>[] = [];

  public get: <T>(f: ConstructorOrFactory<Context, T>) => T;

  constructor(
    locatorCtx: Context,
    private isClass: (v: ConstructorOrFactory<Context, any>) => boolean,
    options: {
      overrides?: Map<Function, Function>;
      isTransient?: boolean;
    } = {},
  ) {
    if (options.overrides != null) this.overrides = options.overrides;
    this.get = baseInstantiator({ isClass, locatorCtx });
    if (!options.isTransient) this.addInternalInterceptor(cachingInterceptor(this.instances));
    this.addInternalInterceptor(overrideInterceptor(this.overrides));
  }

  private addInternalInterceptor(ic: Interceptor<Context>) {
    this.get = ic(this.get);
  }

  /**
   * Adds an interceptor to the locator. All external interceptors should be kept into an array
   * so that when withNewContext is called, they're set to the new locator.
   */
  public addInterceptor(ic: Interceptor<Context>) {
    this.interceptors.push(ic);
    this.get = ic(this.get);
  }

  has<T>(f: ConstructorOrFactory<Context, T>): boolean {
    if (this.instances.has(f)) return true;
    let override = this.overrides.get(f);
    if (override) return this.instances.has(override);
    return false;
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
    const overrides = new Map(this.overrides);
    const loc = new Locator(ctx, this.isClass, { overrides });
    this.interceptors.forEach(ic => loc.addInterceptor(ic));
    return loc;
  }

  clearOverrides() {
    this.overrides.clear();
  }
}
