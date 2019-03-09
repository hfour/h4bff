import { mapSeries } from 'bluebird';
import * as Promise from 'bluebird';
import { Table } from 'anydb-sql-2';
import { v4 as uuid } from 'uuid';
import { Database, TransactionProvider, RPCServiceRegistry } from '@h4bff/backend';
import { BaseService, AppContainer, AppSingleton } from '@h4bff/core';
import { HttpRouter } from './router';

interface File {
  id: string;
  filename: string;
  data: Buffer;
}

export class FilesStorage extends AppSingleton {
  private db = this.container.getSingleton(Database).db;
  filesTbl = this.db.define({
    name: 'files',
    columns: {
      id: { primaryKey: true, dataType: 'uuid' },
      filename: { dataType: 'text', notNull: true },
      data: { notNull: true, dataType: 'bytea' },
    },
  }) as Table<'files', File>;

  constructor(container: AppContainer) {
    super(container);
  }
}

export class UserService extends BaseService {}

export class FilePermissions extends AppSingleton {
  private allowances: Array<(user: UserService) => Promise<boolean>> = [];
  constructor(container: AppContainer) {
    super(container);
  }

  addPermission(p: (user: UserService) => Promise<boolean>) {
    this.allowances.push(p);
  }

  checkPermission(user: UserService) {
    return mapSeries(this.allowances, a => a(user)).then(a => a.some(x => x));
  }
}

export let FilesRouter = (container: AppContainer) => {
  let router = container.getSingleton(HttpRouter);

  router.get('/files/:fileId', (req, res) => {
    res.end('heres file ' + req.params['fileId']);
  });

  router.post('/files', (_req, res) => {
    res.end('file uploaded');
  });
};

export class Files extends BaseService {
  db = this.getSingleton(FilesStorage);
  tx = this.getService(TransactionProvider).tx;

  /**
   * Writes a binary file into the database.
   */
  write(params: { filename: string; data: Buffer }) {
    const record = { id: uuid(), filename: params.filename, data: params.data };
    return this.db.filesTbl
      .insert(record)
      .execWithin(this.tx)
      .thenReturn(record);
  }

  /**
   * Returns a file with the given id.
   */
  get(params: { id: string }) {
    let perms = this.getSingleton(FilePermissions);
    return perms
      .checkPermission(this.getService(UserService))
      .then(() => this.db.filesTbl.where({ id: params.id }).getWithin(this.tx));
  }
}

export let FilesPlugin = (container: AppContainer) => {
  container.load(FilesRouter); // Routes

  // RPC
  const rpc = container.getSingleton(RPCServiceRegistry);
  rpc.add('files', Files);
};
