import { AppContainer, AppSingleton, BaseService, ServiceContext, ServiceContextEvents } from './';

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
  constructor(container: AppContainer, public id = randomId()) {
    super(container);
  }
}

class UserProvider extends BaseService {
  constructor(ctx: ServiceContext, public id = randomId()) {
    super(ctx);
  }
}

describe('Instantiation', () => {
  it('#getSingleton should instantiate a singleton class once', () => {
    let container = new AppContainer();
    let db1 = container.getSingleton(Database);
    let db2 = container.getSingleton(Database);
    expect(db1.id).toEqual(db2.id);
  });

  it('#getSingleton should instantiate a singleton factory once', () => {
    let container = new AppContainer();
    let factoryFunc = () => container.getSingleton(Database);
    let db1 = container.getSingleton(factoryFunc);
    let db2 = container.getSingleton(factoryFunc);
    expect(db1.id).toEqual(db2.id);
  });

  it('#load should force a singleton to instantitate', () => {
    let container = new AppContainer();
    let dbDidInit: boolean = false;
    container.load(
      class MyDB extends Database {
        constructor(container: AppContainer) {
          super(container);
          dbDidInit = true;
        }
      },
    );
    expect(dbDidInit).toBe(true);
  });
});

describe('Overrides', () => {
  it('#getSingleton should use and respect singleton overrides', () => {
    let container = new AppContainer();
    container.overrideSingleton(
      Database,
      class MockDb extends Database {
        id = 'mock-id';
      },
    );
    let db = container.getSingleton(Database);
    expect(db.id).toEqual('mock-id');
  });

  it('#getService should use and respect service overrides', () => {
    let container = new AppContainer();
    container.overrideService(
      UserProvider,
      class MockUserProvider extends UserProvider {
        id = 'mock-id';
      },
    );
    return container.withServiceContext(ctx => {
      expect(ctx.getService(UserProvider).id).toEqual('mock-id');
      return Promise.resolve();
    });
  });
});

describe('AppContainer nesting', () => {
  it('#getSingleton should find instantiated singletons in a parent container', () => {
    let container = new AppContainer();
    let dbId = container.getSingleton(Database).id;
    let childApp = container.createChildContainer();
    expect(childApp.getSingleton(Database).id).toEqual(dbId);
  });

  it('#getSingleton should instantiate non-existing singletons in the child container, not parent', () => {
    let parentApp = new AppContainer();
    let childApp = parentApp.createChildContainer();
    let childDbId = childApp.getSingleton(Database).id;
    expect(parentApp.getSingleton(Database).id !== childDbId);
  });
});

describe('Context disposal', () => {
  it('disposal callbacks should be called when the service context is destoyed', () => {
    let container = new AppContainer();
    let ctxEvents = container.getSingleton(ServiceContextEvents);
    let onDisposeFn = jest.fn((_ctx: ServiceContext, _e: Error | null) => Promise.resolve());
    ctxEvents.onContextDisposed(onDisposeFn);
    return container
      .withServiceContext(_ctx => Promise.resolve())
      .then(() => {
        expect(onDisposeFn).toHaveBeenCalled();
      });
  });

  it('disposal callbacks should be called even on thrown exception', () => {
    let container = new AppContainer();
    let ctxEvents = container.getSingleton(ServiceContextEvents);
    let onDisposeFn = jest.fn((_ctx: ServiceContext, _e: Error | null) => Promise.resolve());
    ctxEvents.onContextDisposed(onDisposeFn);
    return container
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
    let container = new AppContainer();
    let ctxEvents = container.getSingleton(ServiceContextEvents);
    let onDisposeFn = jest.fn((_ctx: ServiceContext, _e: Error | null) => Promise.resolve());
    ctxEvents.onContextDisposed(onDisposeFn);
    return container
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
