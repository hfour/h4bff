import { AppSingleton } from '@h4bff/core';
import { LifecycleApp, Plugin, EnvConfig } from '@h4bff/backend';
import { HttpRouter } from './router';
import * as _ from 'lodash';
import * as toi from '@toi/toi';
import * as toix from '@toi/toix';

export default class SomeApp extends LifecycleApp {
  registerEnvironmentVars() {
    //just load all the configs needed here.
    this.load(AppConfig);
  }

  loadPlugins() {
    this.registerPlugin(SomePlugin);
  }

  start() {
    console.log('listening on http://localhost:8080/');
    this.getSingleton(HttpRouter).listen(8080);
  }
}

export class SomePlugin extends Plugin {
  registerEnvironmentVars() {
    this.app.load(PluginConfig);
  }

  init() {
    //some logic to plug itself in the app.
  }
}

export class PluginConfig extends AppSingleton {
  private randomConfigEnv = this.getSingleton(EnvConfig).register(
    'RANDOM',
    toi.optional().and(toix.str.urlAsString()),
    'Explains the env',
  );

  get randomConfig() {
    return this.randomConfigEnv.value;
  }
}

export class AppConfig extends AppSingleton {
  private importantUrlEnv = this.getSingleton(EnvConfig).register(
    'IMPORTANT_URL',
    toi.optional().and(toix.str.urlAsString()),
    'Some really important URL',
  );

  private dbUrlEnv = this.getSingleton(EnvConfig).register(
    'POSTGRES_URL',
    toi.required().and(toi.str.is()),
    'Database connection string.',
  );
  private dbMaxConnEnv = this.getSingleton(EnvConfig).register(
    'DB_MAX_CONNS',
    toi
      .optional()
      .and(toi.str.is())
      .and(toi.num.parse()),
    'Number which represents the maximum number of connections for the database pool. Example: DB_MAX_CONNS=20',
  );

  //the getters can be with some logic, not just directly the value of the registered env variable
  get clamAvUrl() {
    if (!this.importantUrlEnv.value) {
      console.warn('Warning: CLAMAV_URL is not defined; files WILL NOT be scanned for viruses!');
    }
    return _.defaultTo(this.importantUrlEnv.value, null);
  }

  get db() {
    return {
      url: this.dbUrlEnv.value,
      connections: {
        min: 2,
        max: _.defaultTo(this.dbMaxConnEnv.value, 20),
      },
    };
  }
}

new SomeApp().runApp();
