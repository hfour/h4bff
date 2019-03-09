import { AppSingleton, App, ServiceContextEvents } from '@h4bff/core';
import { TransactionProvider } from './transactionProvider';

/**
 * Responsible for transaction clean-up. Makes sure that a transaction will be
 * disposed properly when the corresponding {@link ServiceContext} is disposed.
 */
export class TransactionCleaner extends AppSingleton {
  constructor(app: App) {
    super(app);
    app.getSingleton(ServiceContextEvents).onContextDisposed((sc, error) => {
      return sc.getService(TransactionProvider).onDispose(error);
    });
  }
}
