import { anydbSQL } from 'anydb-sql-2';
import * as express from 'express';

import { filesPlugin, antivirusPlugin, Files } from './plugins/'
import { App } from './plugins/types';
import { Config } from './plugins/config';

const myApp = new App();

// config
export const config = () => new Config();
myApp.set(config);

// db
export const db = (url: string) => () => anydbSQL({ url });
export const a1db = db(myApp.get(config).fromEnv('DB_URL'))
myApp.set(a1db);

// router 
export const router = () => express();
myApp.set(router);

filesPlugin(myApp)
antivirusPlugin(myApp)

myApp.get(a1db).transaction((tx) => {
    const files = myApp.getInContext(Files, { tx })
    return files.initialize().then(() => {
        return files.write({ filename: 'myfile.bin', data: Buffer.from('asdf') }).then(() => {
            console.log('file upload completely done')
        })
    })
})

myApp.get(router).listen(8080);
