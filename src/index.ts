import * as express from 'express';

import { filesPlugin } from './plugins/'
import { App, ContextualRouter } from './plugins/types';

const myApp = new App();

filesPlugin(myApp)

const router = myApp.get(ContextualRouter);

const expressApp = express();

expressApp.use('/', router.router);

expressApp.listen(8080)