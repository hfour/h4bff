import { v4 as uuid } from 'uuid';

import {
  BaseService,
  App,
  ContextualRouter,
  RPCServiceRegistry,
  Database,
  TransactionProvider,
  AppSingleton
} from './types';
import { Table, AnydbSql } from 'anydb-sql-2';

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

export class FilesRouter extends AppSingleton {
  constructor(app: App) {
    super(app);
    let router = app.getSingleton(ContextualRouter);

    router.get('/files/:fileId', (req, res) => {
      res.end('heres file ' + req.params['fileId']);
    });

    router.post('/files', (_req, res) => {
      res.end('file uploaded');
    });
  }
}

export class Files extends BaseService {
  filesTbl = this.getSingleton(FilesStorage).filesTbl;
  tx = this.getService(TransactionProvider).tx;

  write(params: { filename: string; data: Buffer }) {
    const tx = this.getService(TransactionProvider).tx;
    const record = { id: uuid(), filename: params.filename, data: params.data };
    return this.filesTbl
      .insert(record)
      .execWithin(tx)
      .thenReturn(record);
  }
}

export function filesPlugin(app: App) {
  // Routes
  app.load(FilesRouter);

  // Singletons
  app.load(FilesStorage);

  // RPC
  const rpc = app.getSingleton(RPCServiceRegistry);
  rpc.add('files', Files);
}
