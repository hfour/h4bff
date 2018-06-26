import * as express from 'express';

import { filesPlugin } from './plugins/'
import { App, ContextualRouter } from './plugins/types';

const myApp = new App();

filesPlugin(myApp)

const expressApp = express();
myApp.getClass(ContextualRouter).install('/', expressApp)


expressApp.listen(8080)