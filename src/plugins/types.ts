import { Transaction, AnydbSql, anydbSQL } from 'anydb-sql-2';
import { Request } from 'express';
import * as Express from 'express';
import * as bodyParser from 'body-parser';

export interface ReqTx {
  tx?: Transaction;
  request?: Request;
}

export interface IServiceContext {
  locator: Locator<IServiceContext>;
  app: App;
  req: Request
}

export class BaseService {
  constructor(private sctx: IServiceContext) {}

  getService<T extends BaseService>(SvcClass: {new(sc: IServiceContext):T }):T {
    return this.sctx.locator.getClass(SvcClass)

  }

  getSingleton<T extends AppSingleton>(SingletonClass: {new(sc: App):T }):T {
    return this.sctx.app.get(SingletonClass)
  }
}

type ClassContructor<U, T> = { new (u:U): T };

export class Locator<U> {
  instances: Map<Function, any> = new Map();

  constructor(private arg: U) {}

  // get<T>(f: (u:U) => T): T {
  //   if (!this.instances.has(f)) {
  //     this.instances.set(f, f(this.arg));
  //   }
  //   return this.instances.get(f) as T;
  // }

  // set<T>(f: (u:U) => T): T {
  //   if (this.instances.has(f)) throw new Error('Singleton is already set');
  //   this.instances.set(f, f(this.arg));
  //   return this.instances.get(f);
  // }

  getClass<T>(Klass: ClassContructor<U, T>): T {
    if (!this.instances.has(Klass)) {
      this.instances.set(Klass, new Klass(this.arg));
    }
    return this.instances.get(Klass);
  }
}

export class AppSingleton {
  constructor(protected app: App) {
    this.initialize();
  }

  initialize() {
    throw new Error('Must override initialize() in child class!');
  }
}

export class ContextualRouter extends AppSingleton {
  public router = Express.Router();

  contextualWrapper = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    (req as any).app = this.app;
    (req as any).requestContext = new RPC(req, res)
    next();
  };

  initialize() {}

  post(url: string, ...middlewares: Express.RequestHandler[]) {
    return this.router.post(url, this.contextualWrapper, ...middlewares);
  }

  get(url: string, ...middlewares: Express.RequestHandler[]) {
    return this.router.get(url, this.contextualWrapper, ...middlewares)
  }
}

export class ServiceRegistry extends AppSingleton {
  private router: ContextualRouter;
  private services: { [key: string]: typeof BaseService } = {};

  initialize() {
    this.router = this.app.get(ContextualRouter);
    this.router.post('/rpc', bodyParser.json(), this.routeHandler.bind(this));
  }

  add(namespace: string, svc: typeof BaseService) {
    if (this.services[namespace] != null) {
      throw new Error('Namespace ' + namespace + ' already in use!');
    }
    this.services[namespace] = svc;
  }

  exists(serviceAlias: string, method: string) {
    console.log('exists')
    const ServiceClass = this.services[serviceAlias];
    console.log(ServiceClass);
    if (!ServiceClass) {
      return false;
    }
    const serviceMethod = (ServiceClass.prototype as any)[method];
    console.log('method', serviceMethod)
    console.log()
    return typeof serviceMethod === 'function';// && serviceMethod.__exposed;
  }

  get(serviceAlias: string) {
    return this.services[serviceAlias];
  }

  routeHandler(req: Express.Request, res: Express.Response) {
    let context = new RPC(req, res);
    return context.call();
  };
}

export class Database extends AppSingleton {
  db: AnydbSql;

  initialize() {
    this.db = anydbSQL({ url: 'postgres://admin:admin@localhost:5432/draft' })
  }
}

export class TransactionProvider extends AppSingleton {
  initialize() {}

  get tx() {
    const db = this.app.get(Database).db;
    return db.begin();
  }
}

export class RPC implements IServiceContext {
  public locator = new Locator(this);

  public get app() {
    return (this.req as any).app as App;
  }

  get rpcPath(): string {
    return this.req.query.method;
  }

  get serviceRegistry() {
    return this.app.get(ServiceRegistry);
  }

  constructor(
    public req: Express.Request,
    private res: Express.Response
  ) {
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

    // TODO emit fail, for e.g. audit logger.
    // this.app.getSingleton(RPCEvents).emit('fail', ...)
  }

  private fail(e: Error) {
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
  }

  private success(data: any, code: number = 200) {
    this.res.status(code).json({
      code,
      result: data,
      error: null,
      version: 2
    });
    // TODO emit success, for e.g. audit logger.
    // this.app.getSingleton(RPCEvents).emit('success', ...)
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

    if (!this.serviceRegistry.exists(serviceAlias, method)) {
      return this.jsonFail(404, 'Method not found');
    }

    const ServiceClass = this.serviceRegistry.get(serviceAlias);

    const serviceInstance = new ServiceClass(this);
    const serviceMethod = (serviceInstance as any)[method] as Function;

    // in case the method is not a promise, we don't want the error to bubble-up
    const promiseWrapper = Promise.resolve();
    return promiseWrapper
      .then(() => serviceMethod.call(serviceInstance, req.body.params) as Promise<any>)
      .then(result => this.success(result))
      .catch(error => this.fail(error))
  }
}

export class App {
  private locator = new Locator(this);

  get<T>(Klass: ClassContructor<App, T>): T {
    return this.locator.getClass(Klass)
  }
}
