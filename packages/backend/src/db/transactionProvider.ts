import * as Promise from 'bluebird';
import { Transaction } from 'anydb-sql-2';
import { BaseService, ServiceContext } from '@h4bff/core';
import { Database } from './database';
import { TransactionCleaner } from './transactionCleaner';

/**
 * Provides transaction instance to support transactional behavior within service context.
 * It there is no existing transaction present in the current service context, it creates it.
 * Can be used within a service implementation or where there is a
 * {@link @h4bff/core#ServiceContext} instance available.
 */
export class TransactionProvider extends BaseService {
  private db = this.getSingleton(Database).db;
  private get pool() {
    return this.db.getPool();
  }
  private _tx: Transaction | null | 'disposed' = null;

  constructor(context: ServiceContext) {
    super(context);
    this.getSingleton(TransactionCleaner);
  }

  get tx() {
    if (this._tx === 'disposed') throw new Error('Transaction is already closed');
    if (this._tx == null) this._tx = this.db.begin();
    return this._tx;
  }

  get conn() {
    if (this._tx === 'disposed') throw new Error('Transaction is already closed');
    if (this._tx != null) return this._tx;
    return this.pool;
  }

  /**
   * Gets called on context disposal and makes sure that the transaction
   * is disposed properly. If an error occured it rollbacks the transaction,
   * otherwise it commits it.
   */
  onDispose(error: Error | null) {
    if (this._tx && this._tx !== 'disposed') {
      let tx = this._tx;
      this._tx = 'disposed';

      // TODO: get logger singleton in this TX provider, and log that the rollback could
      // not be performend (unless its "method rollback unavailable in state closed")
      if (error) return tx.rollbackAsync().catch(() => {});
      else return tx.commitAsync();
    }
    return Promise.resolve();
  }
}
