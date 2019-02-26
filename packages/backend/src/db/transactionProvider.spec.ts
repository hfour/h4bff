import { Container } from '@h4bff/core';
import { TransactionProvider } from './transactionProvider';
import { Database } from './database';
import { AnydbSql, Transaction, AnyDBPool } from 'anydb-sql-2';

describe('TransactionProvider', () => {
  describe('Transaction and connection getters', () => {
    it(`should begin new transaction if there is no transaction created yet`, () => {
      let container = new Container();
      process.env.POSTGRES_URL = 'postgres://user:password@localhost:5432/database';

      // prepare Database mock
      let pool = {} as AnyDBPool;
      let transaction = {} as Transaction;
      container.overrideSingleton(
        Database,
        class MockDatabase extends Database {
          db = ({
            getPool: jest.fn(() => pool),
            begin: jest.fn(() => transaction),
          } as any) as AnydbSql;
        },
      );

      let sCtx = container.createServiceContext();
      let transactionProvider = new TransactionProvider(sCtx);

      expect(transactionProvider.tx).toEqual(transaction);
    });

    it(`should return existing transaction as connection`, () => {
      let container = new Container();
      process.env.POSTGRES_URL = 'postgres://user:password@localhost:5432/database';

      // prepare Database mock
      let pool = {} as AnyDBPool;
      let transaction = {} as Transaction;
      container.overrideSingleton(
        Database,
        class MockDatabase extends Database {
          db = ({
            getPool: jest.fn(() => pool),
            begin: jest.fn(() => transaction),
          } as any) as AnydbSql;
        },
      );

      let sCtx = container.createServiceContext();
      let transactionProvider = new TransactionProvider(sCtx);
      transactionProvider.tx;

      expect(transactionProvider.conn).toEqual(transaction);
    });

    it(`should return the pool as connection if there is not transaction created yet`, () => {
      let container = new Container();
      process.env.POSTGRES_URL = 'postgres://user:password@localhost:5432/database';

      // prepare Database mock
      let pool = {} as AnyDBPool;
      let transaction = {} as Transaction;
      container.overrideSingleton(
        Database,
        class MockDatabase extends Database {
          db = ({
            getPool: jest.fn(() => pool),
            begin: jest.fn(() => transaction),
          } as any) as AnydbSql;
        },
      );

      let sCtx = container.createServiceContext();
      let transactionProvider = new TransactionProvider(sCtx);
      transactionProvider.tx;

      expect(transactionProvider.conn).toEqual(pool);
    });
  });

  describe('onDispose', () => {
    it('should do nothing if there is no transaction yet', () => {
      let container = new Container();
      process.env.POSTGRES_URL = 'postgres://user:password@localhost:5432/database';

      // prepare Database mock
      let pool = {} as AnyDBPool;
      let transaction = ({
        rollbackAsync: jest.fn(() => Promise.resolve()),
        commitAsync: jest.fn(() => Promise.resolve()),
      } as any) as Transaction;
      container.overrideSingleton(
        Database,
        class MockDatabase extends Database {
          db = ({
            getPool: jest.fn(() => pool),
            begin: jest.fn(() => transaction),
          } as any) as AnydbSql;
        },
      );

      let sCtx = container.createServiceContext();
      let transactionProvider = new TransactionProvider(sCtx);
      transactionProvider.onDispose(null);

      expect(transaction.commitAsync).not.toHaveBeenCalled();
      expect(transaction.rollbackAsync).not.toHaveBeenCalled();
    });

    it('should commit transaction if no error is present', () => {
      let container = new Container();
      process.env.POSTGRES_URL = 'postgres://user:password@localhost:5432/database';

      // prepare Database mock
      let pool = {} as AnyDBPool;
      let transaction = ({
        rollbackAsync: jest.fn(() => Promise.resolve()),
        commitAsync: jest.fn(() => Promise.resolve()),
      } as any) as Transaction;
      container.overrideSingleton(
        Database,
        class MockDatabase extends Database {
          db = ({
            getPool: jest.fn(() => pool),
            begin: jest.fn(() => transaction),
          } as any) as AnydbSql;
        },
      );

      let sCtx = container.createServiceContext();
      let transactionProvider = new TransactionProvider(sCtx);
      transactionProvider.tx;
      transactionProvider.onDispose(null);

      expect(transaction.commitAsync).toHaveBeenCalled();
      expect(transaction.rollbackAsync).not.toHaveBeenCalled();
    });

    it('should rollback transaction if no error is present', () => {
      let container = new Container();
      process.env.POSTGRES_URL = 'postgres://user:password@localhost:5432/database';

      // prepare Database mock
      let pool = {} as AnyDBPool;
      let transaction = ({
        rollbackAsync: jest.fn(() => Promise.resolve()),
        commitAsync: jest.fn(() => Promise.resolve()),
      } as any) as Transaction;
      container.overrideSingleton(
        Database,
        class MockDatabase extends Database {
          db = ({
            getPool: jest.fn(() => pool),
            begin: jest.fn(() => transaction),
          } as any) as AnydbSql;
        },
      );

      let sCtx = container.createServiceContext();
      let transactionProvider = new TransactionProvider(sCtx);
      transactionProvider.tx;
      transactionProvider.onDispose(new Error());

      expect(transaction.commitAsync).not.toHaveBeenCalled();
      expect(transaction.rollbackAsync).toHaveBeenCalled();
    });
  });
});
