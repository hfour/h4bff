import { ConstructorOrFactory, ClassConstructor } from './internal';

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
