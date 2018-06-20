import { v4 as uuid } from 'uuid';

import { a1db, config, router } from '../index'
import { BaseService,  App } from './types';
import { Table, AnydbSql } from 'anydb-sql-2';

interface File {
    id: string;
    filename: string;
    data: Buffer;
}

export class Files extends BaseService {
    filesTbl: Table<'files', File>;

    constructor(db: AnydbSql, fileUrl: string) {
        super();
        this.events(['created', 'removed', 'updated']);
        this.filesTbl = db.define({
            name: 'files',
            columns: {
                id: { primaryKey: true, dataType: 'uuid' },
                filename: { dataType: 'text', notNull: true },
                data: { notNull: true, dataType: 'bytea' }
            }
        }) as Table<'files', File>;

        console.log('storing files in location', fileUrl);
    }

    initialize() {
        return this.filesTbl.create().ifNotExists().exec();
    }

    write(params: { filename: string; data: Buffer }) {
        const record = { id: uuid(), filename: params.filename, data: params.data };
        return this.filesTbl.insert(record).execWithin(this.ctx.tx)
            .then(() => this.emit.created({ fileId: record.id, data: params.data }))
            .thenReturn(record);
    }
}

export function filesPlugin(app: App) {
    const _router = app.get(router);
    const _db = app.get(a1db);
    const _config = app.get(config);
    const fileUrl = _config.fromEnv('FILE_URL');

    _router.get('/files/:fileId', (req, res) => {
        res.end('heres file ' + req.params['fileId'])
    })

    _router.post('/files', (_req, res) => {
        res.end('file uploaded')
    })

    app.setClass(Files, new Files(_db, fileUrl));
}

export function antivirusPlugin(app: App) {
    const files = app.getClass(Files);

    const _config = app.get(config);

    files.on.created((buffer: any) => {
        console.log('buffer scan', buffer);
        return new AntiVirus().scan(buffer);
    })

    class AntiVirus extends BaseService {
        constructor() {
            super();
            console.log('config in antivirus', _config);
        }

        scan(buffer: Buffer) {
            console.log('file scanned', buffer);
        }
    }
    
    app.setClass(AntiVirus, new AntiVirus());
}