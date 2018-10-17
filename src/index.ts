import { Transaction, anydbSQL } from 'anydb-sql-2';
import { Request } from 'express';
import * as Express from 'express';
import * as bodyParser from 'body-parser';
import * as Promise from 'bluebird';

export interface ReqTx {
  tx?: Transaction;
  request?: Request;
}

export interface IRequestContext {
  getService<T extends BaseService>(SvcClass: ConstructorOrFactory<IRequestContext, T>): T;
  getSingleton<T extends AppSingleton>(SingletonClass: ConstructorOrFactory<App, T>): T;
  req: Express.Request;
  res: Express.Response;
}

type ClassFactory<U, T> = (u: U) => T;
type ClassConstructor<U, T> = { new (u: U): T };
export type ConstructorOrFactory<U, T> = ClassFactory<U, T> | ClassConstructor<U, T>;

export type PublicInterface<T> = { [K in keyof T]: T[K] };

export class App {
  private singletonLocator = new Locator(this, s => '__appSingleton' in s);

  /**
   * @internal
   */
  serviceLocator = new Locator((null as any) as IRequestContext, s => '__baseService' in s);

  getSingleton<T>(Klass: ConstructorOrFactory<App, T>): T {
    return this.singletonLocator.get(Klass);
  }

  overrideSingleton<T>(
    Klass: ConstructorOrFactory<App, T>,
    Klass2: ConstructorOrFactory<App, PublicInterface<T>>
  ) {
    return this.singletonLocator.override(Klass, Klass2);
  }

  overrideService<T>(
    Klass: ConstructorOrFactory<IRequestContext, T>,
    Klass2: ConstructorOrFactory<IRequestContext, PublicInterface<T>>
  ) {
    return this.serviceLocator.override(Klass, Klass2);
  }

  load<T>(Klass: ConstructorOrFactory<App, T>) {
    this.singletonLocator.get(Klass);
  }

  loadPlugins() {
    throw new Error('Override this method to load plugins');
  }
}

export class BaseService {
  protected static __baseService = true;
  static _factory: any;
  static get factory() {
    if (!this._factory) this._factory = (sc: IRequestContext) => new this(sc);
    return this._factory;
  }

  constructor(protected context: IRequestContext) {}

  get req() {
    return this.context.req;
  }

  getService<T extends BaseService>(SvcClass: { new (sc: IRequestContext): T }): T {
    return this.context.getService(SvcClass);
  }

  getSingleton<T extends AppSingleton>(SingletonClass: { new (sc: App): T }): T {
    return this.context.getSingleton(SingletonClass);
  }
}

export class Locator<Context> {
  private instances: Map<Function, any> = new Map();

  constructor(
    private arg: Context,
    private isClass: (v: ConstructorOrFactory<Context, any>) => boolean,
    private overrides: Map<Function, Function> = new Map()
  ) {}

  private isClassTG<T>(v: ConstructorOrFactory<Context, T>): v is ClassConstructor<Context, T> {
    return this.isClass(v);
  }
  private instantiate<T>(f: ConstructorOrFactory<Context, T>) {
    if (this.isClassTG(f)) return new f(this.arg);
    else return f(this.arg);
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

  withNewContext(context: Context) {
    return new Locator(context, this.isClass, this.overrides);
  }
}

export class AppSingleton {
  protected static __appSingleton = true;

  constructor(protected app: App) {}

  getSingleton<T>(Klass: ConstructorOrFactory<App, T>): T {
    return this.app.getSingleton(Klass);
  }
}

export class ContextualRouter extends AppSingleton {
  private router = Express();

  private contexts = new WeakMap<Express.Request, RequestContext>();

  public getContext(req: Express.Request, res: Express.Response) {
    let result = this.contexts.get(req);
    if (!result) {
      this.contexts.set(req, (result = new RequestContext(this.app, req, res)));
    }
    return result;
  }

  contextualWrapper = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    this.getContext(req, res);
    next();
  };

  post(url: string, ...middlewares: Express.RequestHandler[]) {
    return this.router.post(url, this.contextualWrapper, ...middlewares);
  }

  get(url: string, ...middlewares: Express.RequestHandler[]) {
    return this.router.get(url, this.contextualWrapper, ...middlewares);
  }

  use(url: string, ...middlewares: Express.RequestHandler[]) {
    return this.router.use(url, this.contextualWrapper, ...middlewares);
  }

  install(path: string, app: Express.Application) {
    app.use(path, this.router);
  }
}

export class RPCServiceRegistry extends AppSingleton {
  private router = this.app.getSingleton(ContextualRouter);
  private services: { [key: string]: typeof BaseService } = {};

  constructor(app: App) {
    super(app);
    this.router.post('/rpc', bodyParser.json(), this.routeHandler.bind(this));
  }

  add(namespace: string, svc: typeof BaseService) {
    if (this.services[namespace] != null) {
      throw new Error('Namespace ' + namespace + ' already in use!');
    }
    this.services[namespace] = svc;
  }

  exists(serviceAlias: string, method: string) {
    const ServiceClass = this.services[serviceAlias];
    if (!ServiceClass) {
      return false;
    }
    const serviceMethod = (ServiceClass.prototype as any)[method];
    return typeof serviceMethod === 'function'; // && serviceMethod.__exposed;
  }

  get(serviceAlias: string) {
    return this.services[serviceAlias];
  }

  routeHandler(req: Express.Request, res: Express.Response) {
    let dispatcher = this.getSingleton(ContextualRouter)
      .getContext(req, res)
      .getService(RPCDispatcher);
    return dispatcher.call();
  }
}

type RequestListener = (req: RPCDispatcher, error: Error | null) => PromiseLike<void>;

export class RPCEvents extends AppSingleton {
  private listeners: RequestListener[] = [];

  onRequestComplete(listener: RequestListener) {
    this.listeners.push(listener);
  }

  requestComplete: RequestListener = (req, err) => {
    return Promise.all(this.listeners.map(l => l(req, err))).then(() => void 0);
  };
}

export class RequestContext implements IRequestContext {
  constructor(private app: App, public req: Express.Request, public res: Express.Response) {}
  private locator = this.app.serviceLocator.withNewContext(this);

  getService<T extends BaseService>(SvcClass: ConstructorOrFactory<IRequestContext, T>): T {
    return this.locator.get(SvcClass);
  }

  getSingleton<T extends AppSingleton>(SingletonClass: ConstructorOrFactory<App, T>): T {
    return this.app.getSingleton(SingletonClass);
  }
}

export class RPCDispatcher extends BaseService {
  get res() {
    return this.context.res;
  }

  get rpcPath(): string {
    return this.req.query.method;
  }

  get rpcRegistry() {
    return this.getSingleton(RPCServiceRegistry);
  }

  private jsonFail(code: number, message: string, data: any = null) {
    this.res.status(code).json({
      code,
      result: data,
      error: {
        code,
        message
      },
      version: 2
    });
  }

  private fail(e: Error) {
    // TODO emit fail, for e.g. audit logger, instead of locator onDispose
    // this.app.getSingleton(RPCEvents).emit('fail', ...)

    this.getSingleton(RPCEvents)
      .requestComplete(this, e)
      .then(() => {
        if (typeof (e as any).code === 'number') {
          return this.jsonFail((e as any).code, e.message);
        } else if ((e as any).isJoi) {
          console.error(`Validation failed for "${this.rpcPath}":`);
          (e as any).details.forEach((err: any) => console.error(` \-> ${err.message}`));
          return this.jsonFail(400, 'Technical error, the request was malformed.');
        } else {
          console.error(e);
          return this.jsonFail(500, 'Something bad happened.');
        }
      });
  }

  private success(data: any, code: number = 200) {
    // TODO emit success, for e.g. audit logger, instead of locator onDispose
    // this.app.getSingleton(RPCEvents).emit('success', ...)
    console.log('success');
    this.getSingleton(RPCEvents)
      .requestComplete(this, null)
      .then(() => {
        this.res.status(code).json({
          code,
          result: data,
          error: null,
          version: 2
        });
      });
  }

  /**
   * When given 'serviceAlias.method' string, it splits it to ['serviceAlias', 'method'].
   *
   * If the string has more than one dot, the serviceAlias consumes all parts of the name
   * except for the last one:
   *
   * 'path.with.more.dots' => ['path.with.more', 'dots']
   */
  private getServiceNameMethod(s: string): [string, string] {
    const lastDotIndex = s.lastIndexOf('.');
    return [s.slice(0, lastDotIndex), s.slice(lastDotIndex + 1)];
  }

  call() {
    let { req } = this;
    console.log('calling', req.query.method);

    if (!req.query.method) {
      return this.jsonFail(400, '"method" query parameter not found');
    }
    if (!req.body.params) {
      return this.jsonFail(
        400,
        '"params" not found, send an empty object in case of no parameters'
      );
    }

    const [serviceAlias, method] = this.getServiceNameMethod(req.query.method);

    if (!this.rpcRegistry.exists(serviceAlias, method)) {
      return this.jsonFail(404, 'Method not found');
    }

    const ServiceClass = this.rpcRegistry.get(serviceAlias);

    const serviceInstance = this.getService(ServiceClass);
    const serviceMethod = (serviceInstance as any)[method] as Function;

    // in case the method is not a promise, we don't want the error to bubble-up
    const promiseWrapper = Promise.resolve();
    return promiseWrapper
      .then(() => serviceMethod.call(serviceInstance, req.body.params) as Promise<any>)
      .then(result => this.success(result), error => this.fail(error));
  }
}

// DB STUFF:

export class Database extends AppSingleton {
  db = anydbSQL({ url: 'postgres://admin:admin@localhost:5432/draft' });

  private migrations: string[] = [];

  addMigration(mig: string) {
    this.migrations.push(mig);
  }

  getMigrationsList() {
    return this.migrations;
  }

  constructor(app: App) {
    super(app);
  }
}

export class TransactionCleaner extends AppSingleton {
  constructor(app: App) {
    super(app);
    app.getSingleton(RPCEvents).onRequestComplete((reqContext, error) => {
      return reqContext.getService(TransactionProvider).onDispose(error);
    });
  }
}

export class TransactionProvider extends BaseService {
  private db = this.getSingleton(Database).db;
  private pool = this.db.getPool();

  constructor(context: IRequestContext) {
    super(context);
    this.getSingleton(TransactionCleaner);
  }
  private _tx: Transaction | null = null;

  get tx() {
    if (!this._tx) this._tx = this.db.begin();
    return this._tx;
  }

  get conn() {
    if (this._tx) return this._tx;
    return this.pool;
  }

  onDispose(error: Error | null) {
    if (this._tx) {
      let tx = this._tx;
      this._tx = null;

      // TODO: get logger singleton in this TX provider, and log that the rollback could
      // not be performend (unless its "method rollback unavailable in state closed")
      if (error) return tx.rollbackAsync().catch(() => {});
      else return tx.commitAsync();
    }
    return Promise.resolve();
  }
}
