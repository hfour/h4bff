import * as fp from './files-plugin';
import { TransactionProvider } from '@h4bff/backend';
import { App, BaseService } from '@h4bff/core';

import * as Bromise from 'bluebird';
import { UserService } from './files-plugin';

class TxMock extends BaseService {
  get tx() {
    return {
      queryAsync: (<T>(query: { text: string; arguments: any[] }) => {
        console.log('TX QUERYASYNC', query);
        return Bromise.resolve(({ rowCount: 1, rows: ['RESULT'] } as any) as T);
      }) as any,
      rollbackAsync() {
        return null as any;
      },
      commitAsync() {
        return null as any;
      },
    };
  }
  conn: any;
  onDispose() {
    return Bromise.resolve();
  }
}

describe('fp', () => {
  it('works', () => {
    let app = new App();

    // because instantiating Database will throw if this is undefined
    process.env.POSTGRES_URL = 'postgres://user:password@localhost:5432/database';

    app.overrideService(TransactionProvider, TxMock);
    //app.overrideSingleton(Database, DbMock);
    app.overrideService(UserService, class X extends BaseService {});
    app.load(fp.FilesPlugin);

    return app.withServiceContext(ctx => {
      let mocked = ctx.getService(fp.Files);
      return mocked.get({ id: '1' }).then(res => {
        console.log('Actual result', res);
      });
    });
  });
});
