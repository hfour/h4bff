import { Transaction } from 'anydb-sql-2';
import { Request } from 'express';
import * as Express from 'express';

export interface Context {
  tx?: Transaction;
  request?: Request;
}

export interface IServiceContext {
  ctx: Locator<IServiceContext>;
  app: App;
  req: Request
}

export class BaseService {
  constructor(private sctx: IServiceContext) {}

  getService<T extends BaseService>(SvcClass: {new(sc: IServiceContext):T }):T {
    return this.sctx.ctx.getClass(SvcClass)

  }

  getSingleton<T extends AppSingleton>(SingletonClass: {new(sc: App):T }):T {
    return this.sctx.app.getClass(SingletonClass)
  }
}

type AnyConstrutor<U, T> = { new (u:U): T };

export class Locator<U> {
  instances: Map<Function, any> = new Map();

  constructor(private arg: U) {}

  get<T>(f: (u:U) => T): T {
    if (!this.instances.has(f)) {
      this.instances.set(f, f(this.arg));
    }
    return this.instances.get(f) as T;
  }

  set<T>(f: (u:U) => T): T {
    if (this.instances.has(f)) throw new Error('Singleton is already set');
    this.instances.set(f, f(this.arg));
    return this.instances.get(f);
  }

  getClass<T>(Klass: AnyConstrutor<U, T>): T {
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

export class Router extends AppSingleton {
  public routes = Express.Router();

  contextualWrapper = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    (req as any).app = this.app;
    (req as any).requestContext = new RequestContext(req, res)
    next();
  };
  initialize() {

  }
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

  routeHandler = (req: Express.Request, res: Express.Response) => {
    let context = new RequestContext(req, res);
    return context.call();
  };
}

export class RequestContext implements IServiceContext {
  public ctx = new Locator(this);

  public get app() {
    return (this.req as any).app as App;
  }


  get rpcPath(): string {
    return this.req.query.method;
  }

  get serviceRegistry() {
    return this.app.getClass(ServiceRegistry);
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

    if (!this.serviceRegistry.exists(serviceAlias, method)) {
      return this.jsonFail(404, 'Method not found');
    }

    const ServiceClass = this.serviceRegistry.getService(serviceAlias);

    const serviceInstance = new ServiceClass(this);
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
  private appContext = new Locator(this);

  getClass<T>(Klass: AnyConstrutor<App, T>): T {
    return this.appContext.getClass(Klass)
  }
}
