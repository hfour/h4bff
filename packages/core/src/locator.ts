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

  public get: <T>(f: ConstructorOrFactory<Context, T>) => T;

  constructor(
    locatorCtx: Context,
    private isClass: (v: ConstructorOrFactory<Context, any>) => boolean,
    options: {
      overrides?: Map<Function, Function>;
      isTransient?: boolean;
    },
  ) {
    if (options.overrides != null) this.overrides = options.overrides;
    this.get = baseInstantiator({ isClass, locatorCtx });
    if (!options.isTransient) this.addInterceptor(cachingInterceptor(this.instances));
    this.addInterceptor(overrideInterceptor(this.overrides));
  }

  private addInterceptor(ic: Interceptor<Context>) {
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
    return new Locator(ctx, this.isClass, { overrides: this.overrides });
  }

  clearOverrides() {
    this.overrides.clear();
  }
}
