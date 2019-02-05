import { AppSingleton, App, ServiceContextEvents } from '@h4bff/core';
import { TransactionProvider } from './transactionProvider';

export class TransactionCleaner extends AppSingleton {
  constructor(app: App) {
    super(app);
    app.getSingleton(ServiceContextEvents).onContextDisposed((sc, error) => {
      return sc.getService(TransactionProvider).onDispose(error);
    });
  }
}
