import { App, AppSingleton, BaseService, ServiceContext, ServiceContextEvents } from './';
import { Interceptor } from './locator';

/**
 * Returns a random 8 char hex string.
 *
 * See: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
 */
function randomId() {
  return Math.random()
    .toString(16)
    .slice(2, 10);
}

class Database extends AppSingleton {
  constructor(app: App, public id = randomId()) {
    super(app);
  }
}

class UserProvider extends BaseService {
  db = this.getSingleton(Database);
  constructor(ctx: ServiceContext, public id = randomId()) {
    super(ctx);
  }
}

describe('Instantiation', () => {
  it('#getSingleton should instantiate a singleton class once', () => {
    let app = new App();
    let db1 = app.getSingleton(Database);
    let db2 = app.getSingleton(Database);
    expect(db1.id).toEqual(db2.id);
  });

  it('#getSingleton should instantiate a singleton factory once', () => {
    let app = new App();
    let factoryFunc = () => app.getSingleton(Database);
    let db1 = app.getSingleton(factoryFunc);
    let db2 = app.getSingleton(factoryFunc);
    expect(db1.id).toEqual(db2.id);
  });

  it('#getService should instantiate a service from a SC', () => {
    let app = new App();
    return app.withServiceContext(sc => {
      let up = sc.getService(UserProvider);
      expect(up).toBeInstanceOf(UserProvider);
      expect(up.getService(UserProvider)).toBeInstanceOf(UserProvider);
      expect(up.db).toBeInstanceOf(Database);
      return Promise.resolve();
    });
  });

  it('#load should force a singleton to instantitate', () => {
    let app = new App();
    let dbDidInit: boolean = false;
    app.load(
      class MyDB extends Database {
        constructor(app: App) {
          super(app);
          dbDidInit = true;
        }
      },
    );
    expect(dbDidInit).toBe(true);
  });
});

describe('Overrides', () => {
  it('#getSingleton should use and respect singleton overrides', () => {
    let app = new App();
    app.overrideSingleton(
      Database,
      class MockDb extends Database {
        id = 'mock-id';
      },
    );
    let db = app.getSingleton(Database);
    expect(db.id).toEqual('mock-id');
  });

  it('#getService should use and respect service overrides', () => {
    let app = new App();
    app.overrideService(
      UserProvider,
      class MockUserProvider extends UserProvider {
        id = 'mock-id';
      },
    );
    return app.withServiceContext(ctx => {
      expect(ctx.getService(UserProvider).id).toEqual('mock-id');
      return Promise.resolve();
    });
  });

  it('#clearServiceOverrides should cause original services to instantiate', () => {
    let app = new App();
    app.overrideService(
      UserProvider,
      class MockUserProvider extends UserProvider {
        id = 'mock-id';
      },
    );
    app.clearServiceOverrides();
    return app.withServiceContext(ctx => {
      expect(ctx.getService(UserProvider)).toBeInstanceOf(UserProvider);
      return Promise.resolve();
    });
  });

  it('#clearSingletonOverrides should cause original singletons to instantiate', () => {
    let app = new App();
    app.overrideSingleton(
      Database,
      class MockDb extends Database {
        id = 'mock-id';
      },
    );
    app.clearSingletonOverrides();
    expect(app.getSingleton(Database)).toBeInstanceOf(Database);
  });
});

describe('App nesting', () => {
  it('#getSingleton should find instantiated singletons in a parent app', () => {
    let app = new App();
    let dbId = app.getSingleton(Database).id;
    let childApp = app.createChildApp();
    expect(childApp.getSingleton(Database).id).toEqual(dbId);
  });

  it('#getSingleton should instantiate non-existing singletons in the child app, not parent', () => {
    let parentApp = new App();
    let childApp = parentApp.createChildApp();
    let childDbId = childApp.getSingleton(Database).id;
    expect(parentApp.getSingleton(Database).id !== childDbId);
  });
});

describe('Context disposal', () => {
  it('disposal callbacks should be called when the service context is destoyed', () => {
    let app = new App();
    let ctxEvents = app.getSingleton(ServiceContextEvents);
    let onDisposeFn = jest.fn((_ctx: ServiceContext, _e: Error | null) => Promise.resolve());
    ctxEvents.onContextDisposed(onDisposeFn);
    return app
      .withServiceContext(_ctx => Promise.resolve())
      .then(() => {
        expect(onDisposeFn).toHaveBeenCalled();
      });
  });

  it('disposal callbacks should be called even on thrown exception', () => {
    let app = new App();
    let ctxEvents = app.getSingleton(ServiceContextEvents);
    let onDisposeFn = jest.fn((_ctx: ServiceContext, _e: Error | null) => Promise.resolve());
    ctxEvents.onContextDisposed(onDisposeFn);
    return app
      .withServiceContext(_ctx => {
        throw new Error();
      })
      .then(
        () => {},
        _e => {
          expect(onDisposeFn).toHaveBeenCalled();
        },
      );
  });

  it('disposal callbacks should be called on rejected promises', () => {
    let app = new App();
    let ctxEvents = app.getSingleton(ServiceContextEvents);
    let onDisposeFn = jest.fn((_ctx: ServiceContext, _e: Error | null) => Promise.resolve());
    ctxEvents.onContextDisposed(onDisposeFn);
    return app
      .withServiceContext(_ctx => {
        return Promise.reject('reason?');
      })
      .then(
        () => {
          console.log('hahahahahah');
        },
        () => {
          expect(onDisposeFn).toHaveBeenCalled();
        },
      );
  });

  describe.skip('Nested apps override showcase', () => {
    const testSingleton = (_app: App) => {
      return 'some text';
    };

    const childAppPlugin = (app: App) => {
      app.load(testSingleton);
    };

    // used only to prove the point, otherwise imagine we don't have a reference to the child app
    let childApp: any = null;

    class ParentApp extends App {
      init() {
        // we do this in our app
        childApp = this.createChildApp();
        childAppPlugin(childApp);
        return this;
      }
    }

    it('showcase overriding in child apps', () => {
      let app = new ParentApp().init();
      // we need to mock the singleton for the 'childApp' (imagine that we don't have the reference to the child app)
      app.overrideSingleton(testSingleton, () => {
        return 'some text from override';
      });

      expect(app.getSingleton(testSingleton)).toBe('some text from override');
      // this should fail
      expect((childApp as App).getSingleton(testSingleton)).toBe('some text from override');
    });
  });
});

describe('Service instantiator interceptors', () => {
  class BaseServiceTest extends BaseService {}

  it('register new interceptor', () => {
    //given
    const app = new App();
    const myMockFunction = jest.fn();

    const testInterceptor = <Context>(): Interceptor<Context> => {
      return instantiator => f => {
        myMockFunction();
        return instantiator(f);
      };
    };

    //when
    app.registerServiceInterceptor(testInterceptor());
    app.serviceLocator.get(BaseServiceTest);

    //then
    expect(myMockFunction.mock.calls.length).toBe(1);
  });

  it('register more than one service interceptors in given order', () => {
    //given
    const app = new App();
    const myMockFunction1 = jest.fn();
    const myMockFunction2 = jest.fn();
    const order: string[] = [];

    const testInterceptor1 = <Context>(): Interceptor<Context> => {
      return instantiator => f => {
        myMockFunction1();
        order.push('a');
        return instantiator(f);
      };
    };
    const testInterceptor2 = <Context>(): Interceptor<Context> => {
      return instantiator => f => {
        myMockFunction2();
        order.push('b');
        return instantiator(f);
      };
    };

    //when
    app.registerServiceInterceptor(testInterceptor1());
    app.registerServiceInterceptor(testInterceptor2());
    app.serviceLocator.get(BaseServiceTest);

    //then
    expect(myMockFunction1.mock.calls.length).toBe(1);
    expect(myMockFunction2.mock.calls.length).toBe(1);
    expect(order).toEqual(['b', 'a']);
  });

  it('check if the interceptor modifies the service that it instantiates', () => {
    //given
    const app = new App();

    class TestStateService extends BaseService {
      testValue: string = 'test 1';
    }

    const testInterceptor1 = <Context>(): Interceptor<Context> => {
      return instantiator => f => {
        const instance = instantiator(f);
        if (instance instanceof TestStateService) {
          instance.testValue = 'value is modified';
        }
        return instance;
      };
    };

    //when
    app.registerServiceInterceptor(testInterceptor1());
    const testStateService = app.serviceLocator.get(TestStateService);

    //then
    expect(testStateService.testValue).toBe('value is modified');
  });
});
