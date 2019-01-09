import * as fp from './files-plugin';
import { App, TransactionProvider, BaseService } from 'backend';

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
      }
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
    app.overrideService(TransactionProvider, TxMock);
    //app.overrideSingleton(Database, DbMock);
    app.overrideService(UserService, class X extends BaseService {});
    app.load(fp.FilesPlugin);

    let mocked = app.createServiceContext().getService(fp.Files);

    return mocked.get({ id: '1' }).then(res => {
      console.log('Actual result', res);
    });
  });
});
