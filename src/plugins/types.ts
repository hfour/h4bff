import { Transaction } from 'anydb-sql-2';
import { Request } from 'express';
import * as Express from 'express';

export interface Context {
  tx?: Transaction;
  request?: Request;
}

export class BaseService {
  constructor(private app: App, private ctx: Context) {}

  getService(SvcClass) {
    return this.ctx.getClass(SvcClass)

  }

  getSingleton(SingletonClass) {
    return this.app.getClass(SingletonClass)
  }
}

type AnyConstrutor<T> = { new (...args: any[]): T };

export class Context {
  instances: Map<Function, any> = new Map();
  get<T>(f: () => T): T {
    if (!this.instances.has(f)) {
      this.instances.set(f, f());
    }
    return this.instances.get(f) as T;
  }

  set<T>(f: () => T): T {
    if (this.instances.has(f)) throw new Error('Singleton is already set');
    this.instances.set(f, f());
    return this.instances.get(f);
  }

  setClass<T>(Klass: AnyConstrutor<T>, instance: T): T {
    if (!this.instances.has(Klass)) {
      this.instances.set(Klass, instance);
    }
    return this.instances.get(Klass);
  }
  getClass<T>(Klass: AnyConstrutor<T>): T {
    return this.instances.get(Klass);
  }
}

export class Router {
  public routes = Express.Router();

  contextualWrapper = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    (req as any).ctx = new Context();
    (req as any).app = this.app;
    next();
  };
  constructor(private app: App) {}
  post(url: string, ...middlewares: Express.RequestHandler[]) {
    return this.routes.post(url, this.contextualWrapper, ...middlewares);
  }
}

/**
 * When given 'serviceAlias.method' string, it splits it to ['serviceAlias', 'method'].
 *
 * If the string has more than one dot, the serviceAlias consumes all parts of the name
 * except for the last one:
 *
 * 'path.with.more.dots' => ['path.with.more', 'dots']
 */
function getServiceNameMethod(s: string): [string, string] {
  const lastDotIndex = s.lastIndexOf('.');
  return [s.slice(0, lastDotIndex), s.slice(lastDotIndex + 1)];
}

export class AppSingleton {
  constructor(protected app: App) {
    this.initialize();
  }

  initialize() {
    throw new Error('Must override initialize() in child class!');
  }
}

type ServiceMethod = Function; // & { __exposed: true; __auditOpts: AuditOpts };

export class ServiceRegistry extends AppSingleton {
  private router = this.app.getClass(Router);
  private services: { [key: string]: typeof BaseService } = {};

  initialize() {
    this.router.post('/rpc', this.routeHandler);
  }

  public get exposedApp() {
    return this.app;
  }

  add(namespace: string, svc: typeof BaseService) {
    if (this.services[namespace] != null) {
      throw new Error('Namespace ' + namespace + ' already in use!');
    }
    this.services[namespace] = svc;
  }

  /**
   * Returns true if:
   *   1. the service exists
   *   2. the method exists
   *   3. the method is an exposed function
   */
  exists(serviceAlias: string, method: string) {
    const ServiceClass = this.services[serviceAlias];
    if (!ServiceClass) {
      return false;
    }
    const serviceMethod = (ServiceClass.prototype as any)[method];
    return typeof serviceMethod === 'function' && serviceMethod.__exposed;
  }

  getService(serviceAlias: string) {
    return this.services[serviceAlias];
  }

  routeHandler = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    let context = new ServiceContext(req, res, this);
    return context.call();
  };
}

export class ServiceContext {
  private ctx: Context;

  private get app() {
    return this.reg.exposedApp;
  }

  get rpcPath(): string {
    return this.req.query.method;
  }

  constructor(
    private req: Express.Request,
    private res: Express.Response,
    private reg: ServiceRegistry
  ) {
    this.ctx = (req as any).ctx;
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

    //TODO emit fail, for e.g. audit logger.
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
    //TODO emit success, for e.g. audit logger.
    // this.app.getSingleton(RPCEvents).emit('success', ...)
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

    const [serviceAlias, method] = getServiceNameMethod(req.query.method);

    if (!this.reg.exists(serviceAlias, method)) {
      return this.jsonFail(404, 'Method not found');
    }

    const ServiceClass = this.reg.getService(serviceAlias);

    const serviceInstance = new ServiceClass(this.app, this.ctx);
    const serviceMethod = (serviceInstance as any)[method] as ServiceMethod;

    // in case the method is not a promise, we don't want the error to bubble-up
    const promiseWrapper = Promise.resolve();
    return promiseWrapper
      .then(() => serviceMethod.call(serviceInstance, req.body.params) as Promise<any>)
      .then(result => this.success(result))
      .catch(error => this.fail(error))
  }
}

export class App {
  private appContext = new Context();

  instances: Map<Function, any> = new Map();

  get<T>(f: () => T): T {
    if (!this.instances.has(f)) {
      this.instances.set(f, f());
    }
    return this.instances.get(f) as T;
  }

  set<T>(f: () => T): T {
    if (this.instances.has(f)) throw new Error('Singleton is already set');
    this.instances.set(f, f());
    return this.instances.get(f);
  }

  setClass<T>(Klass: AnyConstrutor<T>, instance: T): T {
    if (!this.instances.has(Klass)) {
      this.instances.set(Klass, instance);
    }
    return this.instances.get(Klass);
  }

  getClass<T>(Klass: AnyConstrutor<T>): T {
    return this.instances.get(Klass);
  }

  getInContext<T>(Klass: AnyConstrutor<T>, ctx: Context) {
    const service = this.instances.get(Klass);
    service.setContext(ctx);
    return service as T;
  }
}
