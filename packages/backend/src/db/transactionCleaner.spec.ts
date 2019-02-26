import { Container, ServiceContextEvents } from '@h4bff/core';
import { TransactionCleaner } from './transactionCleaner';
import { TransactionProvider } from './transactionProvider';

describe('TransactionCleaner', () => {
  it(`should register 'dispose' callback on context disposal`, () => {
    // prepare  and mock ServiceContextEvents
    let container = new Container();
    let tcOnDisposeCallback;
    container.overrideSingleton(
      ServiceContextEvents,
      class MockServiceContextEvents extends ServiceContextEvents {
        onContextDisposed = jest.fn(arg => (tcOnDisposeCallback = arg));
      },
    );
    let mockServiceContextEvents = container.getSingleton(ServiceContextEvents);

    new TransactionCleaner(container);

    expect(mockServiceContextEvents.onContextDisposed).toHaveBeenCalledWith(tcOnDisposeCallback);
  });

  it(`should call 'onDispose' on the TransactionProvider when context is disposed`, () => {
    // prepare  and mock ServiceContextEvents and TransactionProvider
    let container = new Container();
    container.overrideSingleton(
      ServiceContextEvents,
      class MockServiceContextEvents extends ServiceContextEvents {
        onContextDisposed = jest.fn();
      },
    );
    process.env.POSTGRES_URL = 'postgres://user:password@localhost:5432/database';
    container.overrideService(
      TransactionProvider,
      class MockTransactionProvider extends TransactionProvider {
        onDispose = jest.fn(() => Promise.resolve());
      },
    );
    let mockServiceContextEvents = container.getSingleton(ServiceContextEvents);

    new TransactionCleaner(container);

    // invoke the callback and assert that 'onDispose' is called
    let sCtx = container.createServiceContext();
    let tcOnDisposeCallback = (mockServiceContextEvents as any).onContextDisposed.mock.calls[0][0];
    let error = new Error();
    return tcOnDisposeCallback(sCtx, error).then(() => {
      let transactionProvider = sCtx.getService(TransactionProvider);
      expect(transactionProvider.onDispose).toHaveBeenCalledWith(error);
      return Promise.resolve();
    });
  });
});
