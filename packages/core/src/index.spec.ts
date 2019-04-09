import { App, AppSingleton, BaseService, ServiceContext, ServiceContextEvents } from './';

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
});
