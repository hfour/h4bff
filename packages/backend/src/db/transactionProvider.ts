import * as Promise from 'bluebird';
import { Transaction } from 'anydb-sql-2';
import { BaseService, ServiceContext } from 'core';
import { Database } from './database';
import { TransactionCleaner } from './transactionCleaner';

export class TransactionProvider extends BaseService {
  private db = this.getSingleton(Database).db;
  private pool = this.db.getPool();

  constructor(context: ServiceContext) {
    super(context);
    this.getSingleton(TransactionCleaner);
  }
  private _tx: Transaction | null = null;

  get tx() {
    if (!this._tx) this._tx = this.db.begin();
    return this._tx;
  }

  get conn() {
    if (this._tx) return this._tx;
    return this.pool;
  }

  onDispose(error: Error | null) {
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
