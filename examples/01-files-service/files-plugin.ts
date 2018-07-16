import { v4 as uuid } from 'uuid';
import { Table } from 'anydb-sql-2';
import { BaseService, App, AppSingleton, ContextualRouter, RPCServiceRegistry } from 'h4b2'; // from h4b2
import { Database, TransactionProvider } from './database';
import { mapSeries } from 'bluebird';

interface File {
  id: string;
  filename: string;
  data: Buffer;
}

export class FilesStorage extends AppSingleton {
  private db = this.app.getSingleton(Database).db;
  filesTbl = this.db.define({
    name: 'files',
    columns: {
      id: { primaryKey: true, dataType: 'uuid' },
      filename: { dataType: 'text', notNull: true },
      data: { notNull: true, dataType: 'bytea' }
    }
  }) as Table<'files', File>;

  constructor(app: App) {
    super(app);

    this.app.getSingleton(Database).addMigration(
      this.filesTbl
        .create()
        .ifNotExists()
        .toQuery().text
    );
  }
}

declare class UserService extends BaseService {}

export class FilePermissions extends AppSingleton {
  private allowances: Array<(user: UserService) => Promise<boolean>>;
  constructor(app: App) {
    super(app);
  }

  addPermission(p: (user: UserService) => Promise<boolean>) {
    this.allowances.push(p);
  }

  checkPermission(user: UserService) {
    return mapSeries(this.allowances, a => a(user)).then(a => a.some(x => x));
  }
}

export let FilesRouter = (app: App) => {
  let router = app.getSingleton(ContextualRouter);

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
    perms
      .checkPermission(this.getService(UserService))
      .then(() => this.db.filesTbl.where({ id: params.id }).execWithin(this.tx));
  }
}

export let FilesPlugin = (app: App) => {
  app.load(FilesRouter); // Routes
  app.load(FilesStorage); // Storage, storing DB tables
  app.load(FilePermissions); // file permissions

  // RPC
  const rpc = app.getSingleton(RPCServiceRegistry);
  rpc.add('files', Files);
};
