import * as express from 'express';
import { App } from '@h4bff/core';
import { RequestContextProvider } from '@h4bff/backend';
import { FilesPlugin } from './files-plugin';
import { NestedAppsPlugin } from './nestedApps-plugin';
//import { Database } from './database';

export default class MyApp extends App {
  loadPlugins() {
    this.load(FilesPlugin);
    this.load(NestedAppsPlugin);
  }

  start() {
    this.loadPlugins();
    const expressApp = express();
    this.getSingleton(RequestContextProvider).install('/', expressApp);
    console.log('listening on http://localhost:8080/');
    expressApp.listen(8080);
  }

  migrate() {
    //const bla = this.getSingleton(Database).runMigrations();
  }
}

new MyApp().start();
