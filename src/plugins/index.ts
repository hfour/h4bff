import { v4 as uuid } from 'uuid';

import { BaseService, App, ContextualRouter, ServiceRegistry, Database, TransactionProvider } from './types';
import { Table } from 'anydb-sql-2';

interface File {
    id: string;
    filename: string;
    data: Buffer;
}

export class Files extends BaseService {
    filesTbl: Table<'files', File>;

    initialize() {
        const db = this.getSingleton(Database).db;

        this.filesTbl = db.define({
            name: 'files',
            columns: {
                id: { primaryKey: true, dataType: 'uuid' },
                filename: { dataType: 'text', notNull: true },
                data: { notNull: true, dataType: 'bytea' }
            }
        }) as Table<'files', File>;

        const tx = this.getSingleton(TransactionProvider).tx;
        return this.filesTbl.create().ifNotExists().execWithin(tx);
    }

    write(params: { filename: string; data: Buffer }) {
        this.initialize(); // ??!??!!
        const tx = this.getSingleton(TransactionProvider).tx;
        const record = { id: uuid(), filename: params.filename, data: params.data };
        return this.filesTbl.insert(record).execWithin(tx)
            .thenReturn(record);
    }
}

export function filesPlugin(app: App) {
    // Routes
    const router = app.get(ContextualRouter);

    router.get('/files/:fileId', (req, res) => {
        res.end('heres file ' + req.params['fileId'])
    })

    router.post('/files', (_req, res) => {
        res.end('file uploaded')
    })

    // RPC
    const rpc = app.get(ServiceRegistry);
    rpc.add('files', Files);
}
