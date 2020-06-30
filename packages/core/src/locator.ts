import { ConstructorOrFactory, ClassConstructor } from './internal';

export type Instantiator<Context> = <T>(f: ConstructorOrFactory<Context, T>) => T;
export type InterceptorGet<Context> = (i: Instantiator<Context>) => Instantiator<Context>;

export interface Interceptor<C> {
  get?: InterceptorGet<C>;
  has?: <T>(f: ConstructorOrFactory<C, T>) => boolean;
  override?: <T>(f: ConstructorOrFactory<C, T>, g: ConstructorOrFactory<C, T>) => void;
  clear?: () => void;
  inherit(): Interceptor<C>;
}

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

export class CachingInterceptor<C> implements Interceptor<C> {
  private instances: Map<Function, any> = new Map();

  constructor(i?: Map<Function, Function>) {
    if (i) {
      this.instances = i;
    }
  }

  get: InterceptorGet<C> = i => f => {
    if (!this.instances.has(f)) {
      this.instances.set(f, i(f));
    }
    return this.instances.get(f);
  };

  has<T>(f: ConstructorOrFactory<C, T>): boolean {
    return this.instances.has(f);
  }

  inherit(): Interceptor<C> {
    const i = new CachingInterceptor<C>(this.instances);
    return i;
  }
}

export class OverrideInterceptor<C> implements Interceptor<C> {
  overrides: Map<Function, Function> = new Map();
  constructor(o?: Map<Function, Function>) {
    if (o) {
      this.overrides = o;
    }
  }

  get: InterceptorGet<C> = i => f => {
    if (this.overrides.has(f)) {
      f = this.overrides.get(f) as any;
    }
    return i(f);
  };

  has<T>(f: ConstructorOrFactory<C, T>): boolean {
    return this.overrides.has(f);
  }

  override<T>(f: ConstructorOrFactory<C, T>, g: ConstructorOrFactory<C, T>) {
    this.overrides.set(f, g);
  }

  clear() {
    this.overrides.clear();
  }

  inherit(): Interceptor<C> {
    const i = new OverrideInterceptor<C>(this.overrides);
    return i;
  }
}

export class Locator<Context> {
  private interceptors: Interceptor<Context>[] = [];
  public baseGet: <T>(f: ConstructorOrFactory<Context, T>) => T;

  constructor(
    locatorCtx: Context,
    private isClass: (v: ConstructorOrFactory<Context, any>) => boolean,
  ) {
    this.baseGet = baseInstantiator({ isClass, locatorCtx });
  }

  public addInterceptor(ic: Interceptor<Context>) {
    this.interceptors.push(ic);
  }

  get = <T>(f: ConstructorOrFactory<Context, T>) => {
    const ics = this.interceptors.filter(i => i.get) as Interceptor<Context>[];
    const reducedFn = ics.reduce((acc, ic) => ic.get!(acc), this.baseGet);
    return reducedFn(f);
  };

  has<T>(f: ConstructorOrFactory<Context, T>): boolean {
    const ics = this.interceptors.filter(i => i.has);
    const found = ics.some(ic => ic.has!(f));
    return found;
  }

  override<T>(f: ConstructorOrFactory<Context, T>, g: ConstructorOrFactory<Context, T>) {
    const ics = this.interceptors.filter(i => i.override);
    ics.forEach(i => i.override!(f, g));
  }

  withNewContext(ctx: Context) {
    const loc = new Locator(ctx, this.isClass);
    this.interceptors.forEach(ic => {
      const cloned = ic.inherit();
      loc.addInterceptor(cloned);
    });
    return loc;
  }

  clearOverrides() {
    const ics = this.interceptors.filter(i => i.clear);
    ics.forEach(i => i.clear!());
  }
}
