import { AppContainer } from '@h4bff/core';
import { FilesPlugin } from './files-plugin';
import { NestedAppsPlugin } from './nestedApps-plugin';
import { AppRouter } from './router';

export default class MyApp extends AppContainer {
  loadPlugins() {
    this.load(FilesPlugin);
    this.load(NestedAppsPlugin);
  }

  start() {
    this.loadPlugins();
    console.log('listening on http://localhost:8080/');
    this.getSingleton(AppRouter).listen(8080);
  }
}

new MyApp().start();
