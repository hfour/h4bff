import * as express from 'express';

import { filesPlugin } from './plugins/'
import { App, ContextualRouter } from './plugins/types';

const myApp = new App();

filesPlugin(myApp)

const expressApp = express();
myApp.getClass(ContextualRouter).install('/', expressApp)

console.log('listening on http://localhost:8080/')
expressApp.listen(8080)