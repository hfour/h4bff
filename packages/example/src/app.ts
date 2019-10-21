import { App } from '@h4bff/core';
import { FilesPlugin } from './files-plugin';
import { NestedAppsPlugin } from './nested-apps-plugin';
import { HttpRouter } from './router';

export default class MyApp extends App {
  loadPlugins() {
    this.load(FilesPlugin);
    this.load(NestedAppsPlugin);
  }

  start() {
    this.loadPlugins();
    console.log('listening on http://localhost:8080/');
    this.getSingleton(HttpRouter).listen(8080);
  }
}

new MyApp().start();
