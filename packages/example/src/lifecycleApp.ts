import { LifecycleApp, EnvConfig, Router, Database } from '@h4bff/backend';
import * as _ from 'lodash';
import * as https from 'https';
import * as toi from '@toi/toi';
import * as toix from '@toi/toix';
import { App } from '@h4bff/core';

export class AppConfig extends EnvConfig {
  private importantUrlEnv = this.env.register(
    'IMPORTANT_URL',
    toi.optional().and(toix.str.urlAsString()),
    'Some really important URL',
  );

  private dbUrlEnv = this.env.register('POSTGRES_URL', toi.required().and(toi.str.is()), 'Database connection string.');
  private dbMaxConnEnv = this.env.register(
    'DB_MAX_CONNS',
    toi
      .optional()
      .and(toi.str.is())
      .and(toi.num.parse()),
    'Number which represents the maximum number of connections for the database pool. Example: DB_MAX_CONNS=20',
  );

  //the getters can be with some logic, not just directly the value of the registered env variable
  get complexConfig() {
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

export class PluginConfig extends EnvConfig {
  private randomConfigEnv = this.env.register('RANDOM', toi.optional().and(toix.str.urlAsString()), 'Explains the env');

  get randomConfig() {
    return this.randomConfigEnv.value;
  }
}

export const FirstPlugin = {
  init: (app: App) => {
    console.log(app);
  },
};

export const SecondPlugin = {
  config: PluginConfig,
  init: () => {
    console.log('second');
  },
};

export class ExampleApp extends LifecycleApp {
  protected getEnvConfig() {
    //returns the apps config
    return AppConfig;
  }

  protected registerPlugins() {
    //returns all the plugins. they include their own config, that is loaded after the apps config, and an init() that plugs (activates) the plugin
    return [FirstPlugin, SecondPlugin];
  }

  protected init() {
    //generally loads stuff that should be on parent level, loaded before anything else (or common for all plugins)
    this.load(Database);
  }

  protected start(): void {
    //starts the app by creating the server and listens to a port
    let router = this.getSingleton(Router).router;
    https.createServer({}, router).listen('3000');
  }
}

//usage in tests, running scripts, etc.
new ExampleApp().prepare();

//usage for starting the server
new ExampleApp().prepare().runApp();
