import { v4 as uuid } from 'uuid';

import { AppParts, BaseService,  App } from './types';

export function filesPlugin(app: App, parts: AppParts) {
    const { db, router } = parts;

    const filesTbl = db.define({
        name: 'files',
        columns: {
            id: { primaryKey: true, dataType: 'uuid' },
            filename: { dataType: 'text', notNull: true },
            data: { notNull: true, dataType: 'bytea' }
        }
    })

    class Files extends BaseService {
        static filesTbl = filesTbl;

        constructor() {
            super();
            this.events(['created', 'removed', 'updated']);
        }

        initialize() {
            return filesTbl.create().ifNotExists().exec();
        }

        write(params: { filename: string; data: Buffer }) {
            const record = { id: uuid(), filename: params.filename, data: params.data };
            return filesTbl.insert(record).execWithin(this.ctx.tx)
                .then(() => this.emit.created({ fileId: record.id }))
                .thenReturn(record);
        }
    }

    router.get('/files/:fileId', (req, res) => {
        res.end('heres file ' + req.params['fileId'])
    })

    router.post('/files', (_req, res) => {
        res.end('file uploaded')
    })

    app.registerService('files', new Files())
}

export function antivirusPlugin(app: App, _parts: AppParts) {
    const Files = app.getService('files');

    Files.on.created((buffer: any) => {
        new AntiVirus().scan(buffer);
    })

    class AntiVirus extends BaseService {
        scan(buffer: Buffer) {
            console.log('file scanned', buffer);
        }
    }
    
    app.registerService('antivirus', new AntiVirus());
}