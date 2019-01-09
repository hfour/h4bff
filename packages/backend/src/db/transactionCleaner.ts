import { AppSingleton, App } from 'core';
import { RPCEvents } from '../rpc';
import { TransactionProvider } from './transactionProvider';

export class TransactionCleaner extends AppSingleton {
  constructor(app: App) {
    super(app);
    app.getSingleton(RPCEvents).onRequestComplete((reqContext, error) => {
      return reqContext.getService(TransactionProvider).onDispose(error);
    });
  }
}
