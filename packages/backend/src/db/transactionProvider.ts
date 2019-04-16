import * as Promise from 'bluebird';
import { Transaction } from 'anydb-sql-3';
import { BaseService, ServiceContext } from '@h4bff/core';
import { Database } from './database';
import { TransactionCleaner } from './transactionCleaner';

/**
 * Provides transaction instance to support transactional behavior within service context.
 * It there is no existing transaction present in the current service context, it creates it.
 * Can be used within a service implementation or where there is a {@link ServiceContext} instance available.
 */
export class TransactionProvider extends BaseService {
  private db = this.getSingleton(Database).db;
  private _tx: Transaction | null = null;

  constructor(context: ServiceContext) {
    super(context);
    this.getSingleton(TransactionCleaner);
  }

  get tx() {
    if (!this._tx) this._tx = this.db.begin();
    return this._tx;
  }

  /**
   * Gets called on context disposal and makes sure that the transaction
   * is disposed properly. If an error occured it rollbacks the transaction,
   * otherwise it commits it.
   */
  onDispose(error: Error | null): Promise<any> {
    if (this._tx) {
      let tx = this._tx;
      this._tx = null;

      // TODO: get logger singleton in this TX provider, and log that the rollback could
      // not be performend (unless its "method rollback unavailable in state closed")
      // TODO: Remove cast as any
      if (error) return tx.rollbackAsync().catch(() => {}) as any;
      else return tx.commitAsync() as any;
    }
    return Promise.resolve();
  }
}
