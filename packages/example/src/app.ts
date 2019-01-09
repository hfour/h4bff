import * as express from 'express';
import { App } from 'core';
import { ContextualRouter } from 'backend';

import { FilesPlugin } from './files-plugin';
//import { Database } from './database';

export default class MyApp extends App {
  loadPlugins() {
    this.load(FilesPlugin);
  }

  start() {
    this.loadPlugins();
    const expressApp = express();
    this.getSingleton(ContextualRouter).install('/', expressApp);
    console.log('listening on http://localhost:8080/');
    expressApp.listen(8080);
  }

  migrate() {
    //const bla = this.getSingleton(Database).runMigrations();
  }
}

new MyApp().start();
