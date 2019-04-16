import { App } from '@h4bff/core';
import { TransactionProvider } from './transactionProvider';
import { Database } from './database';
import { AnydbSql, Transaction, AnyDBPool } from 'anydb-sql-2';
import * as Promise from 'bluebird';

function ignore() {}

function prepare() {
  let app = new App();
  process.env.POSTGRES_URL = 'postgres://user:password@localhost:5432/database';

  // prepare Database mock
  let pool = {} as AnyDBPool;
  let transaction = ({
    rollbackAsync: jest.fn(() => Promise.resolve()),
    commitAsync: jest.fn(() => Promise.resolve()),
  } as any) as Transaction;

  app.overrideSingleton(
    Database,
    class MockDatabase extends Database {
      db = ({
        getPool: jest.fn(() => pool),
        begin: jest.fn(() => transaction),
      } as any) as AnydbSql;
    },
  );
  return { app, pool, transaction };
}
describe('TransactionProvider', () => {
  describe('Transaction and connection getters', () => {
    it(`should begin new transaction if there is no transaction created yet`, () => {
      let { app, transaction } = prepare();
      return app.withServiceContext(sCtx => {
        expect(sCtx.getService(TransactionProvider).tx).toEqual(transaction);
        return Promise.resolve();
      });
    });

    it(`should return existing transaction as connection`, () => {
      let { app, transaction } = prepare();
      return app.withServiceContext(sCtx => {
        let transactionProvider = new TransactionProvider(sCtx);
        transactionProvider.tx;
        expect(transactionProvider.conn).toEqual(transaction);
        return Promise.resolve();
      });
    });

    it(`should return the pool as connection if there is not transaction created yet`, () => {
      let { app, pool } = prepare();

      return app.withServiceContext(sCtx => {
        let transactionProvider = new TransactionProvider(sCtx);
        expect(transactionProvider.conn).toEqual(pool);
        return Promise.resolve();
      });
    });
  });

  describe('onDispose', () => {
    it('should do nothing if there is no transaction yet', () => {
      let { app, transaction } = prepare();

      return app
        .withServiceContext(_sCtx => {
          return Promise.resolve();
        })
        .then(ignore, ignore)
        .then(() => {
          expect(transaction.commitAsync).not.toHaveBeenCalled();
          expect(transaction.rollbackAsync).not.toHaveBeenCalled();
        });
    });

    it('should commit transaction if no error is present', () => {
      let { app, transaction } = prepare();

      return app
        .withServiceContext(sCtx => {
          sCtx.getService(TransactionProvider).tx;
          return Promise.resolve();
        })
        .then(ignore, ignore)
        .then(() => {
          expect(transaction.commitAsync).toHaveBeenCalled();
          expect(transaction.rollbackAsync).not.toHaveBeenCalled();
        });
    });

    it('should rollback transaction if no error is present', () => {
      let { app, transaction } = prepare();

      return app
        .withServiceContext(sCtx => {
          sCtx.getService(TransactionProvider).tx;
          throw new Error('Service context failed for some reason');
        })
        .then(ignore, ignore)
        .then(() => {
          expect(transaction.commitAsync).not.toHaveBeenCalled();
          expect(transaction.rollbackAsync).toHaveBeenCalled();
        });
    });
  });
});
