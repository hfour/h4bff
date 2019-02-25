import { App, ServiceContextEvents } from '@h4bff/core';
import { TransactionCleaner } from './transactionCleaner';
import { TransactionProvider } from './transactionProvider';

describe('TransactionCleaner', () => {
  it(`should register 'dispose' callback on context disposal`, () => {
    // prepare app and mock ServiceContextEvents
    let app = new App();
    let tcOnDisposeCallback;
    app.overrideSingleton(
      ServiceContextEvents,
      class MockServiceContextEvents extends ServiceContextEvents {
        onContextDisposed = jest.fn(arg => (tcOnDisposeCallback = arg));
      },
    );
    let mockServiceContextEvents = app.getSingleton(ServiceContextEvents);

    new TransactionCleaner(app);

    expect(mockServiceContextEvents.onContextDisposed).toHaveBeenCalledWith(tcOnDisposeCallback);
  });

  it(`should call 'onDispose' on the TransactionProvider when context is disposed`, () => {
    // prepare app and mock ServiceContextEvents and TransactionProvider
    let app = new App();
    app.overrideSingleton(
      ServiceContextEvents,
      class MockServiceContextEvents extends ServiceContextEvents {
        onContextDisposed = jest.fn();
      },
    );
    process.env.POSTGRES_URL = 'postgres://user:password@localhost:5432/database';
    app.overrideService(
      TransactionProvider,
      class MockTransactionProvider extends TransactionProvider {
        onDispose = jest.fn(() => Promise.resolve());
      },
    );
    let mockServiceContextEvents = app.getSingleton(ServiceContextEvents);

    new TransactionCleaner(app);

    // invoke the callback and assert that 'onDispose' is called
    let sCtx = app.createServiceContext();
    let tcOnDisposeCallback = (mockServiceContextEvents as any).onContextDisposed.mock.calls[0][0];
    let error = new Error();
    return tcOnDisposeCallback(sCtx, error).then(() => {
      let transactionProvider = sCtx.getService(TransactionProvider);
      expect(transactionProvider.onDispose).toHaveBeenCalledWith(error);
      return Promise.resolve();
    });
  });
});
