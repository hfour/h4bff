import { AppSingleton, BaseService, App } from '../../src';
import { anydbSQL, Transaction } from 'anydb-sql-2';

import { RPCEvents } from './rpc';

export class Database extends AppSingleton {
  db = anydbSQL({ url: 'postgres://admin:admin@localhost:5432/draft' });

  private migrations: string[] = [];

  addMigration(mig: string) {
    this.migrations.push(mig);
  }

  getMigrationsList() {
    return this.migrations;
  }
}

export class TransactionCleaner extends AppSingleton {
  constructor(app: App) {
    super(app);
    this.getSingleton(RPCEvents).onRequestComplete((reqContext, error) => {
      return reqContext.getService(TransactionProvider).onDispose(error);
    });
  }
}

export class TransactionProvider extends BaseService {
  private db = this.getSingleton(Database).db;
  private pool = this.db.getPool();

  private _tx: Transaction;

  get tx() {
    if (!this._tx) this._tx = this.db.begin();
    return this._tx;
  }

  get conn() {
    if (this._tx) return this._tx;
    return this.pool;
  }

  onDispose(error: Error) {
    if (this._tx) {
      let tx = this._tx;
      this._tx = null;

      // TODO: get logger singleton in this TX provider, and log that the rollback could
      // not be performend (unless its "method rollback unavailable in state closed")
      if (error) return tx.rollbackAsync().catch(() => {});
      else return tx.commitAsync();
    }
    return Promise.resolve();
  }
}
