import { anydbSQL } from 'anydb-sql-2';
import * as express from 'express';

import { filesPlugin, antivirusPlugin } from './plugins/'
import { App } from './plugins/types';

const db = anydbSQL({ url: 'postgres://admin:admin@localhost:5432/h4b2' });
const router = express();
const parts = { db, router };

const a1 = new App(parts);

filesPlugin(a1, parts)
antivirusPlugin(a1, parts)

db.transaction((tx) => {
    const files: any = a1.getInContext('files', { tx })
    console.log(files);
    return files.initialize().then(() => {
        return files.write({ filename: 'myfile.bin', data: Buffer.from('asdf') }).then(() => {
            console.log('file upload completely done')
        })
    })
})

router.listen(8080);
