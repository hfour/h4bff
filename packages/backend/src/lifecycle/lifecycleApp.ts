import { App } from '@h4bff/core';
import { Envaridator } from 'envaridator';
import { EnvConfig } from './config';

type EnvConfigClass = { new (app: App): EnvConfig };
export type Plugin = { init: (app: App) => void; config?: EnvConfigClass }; //maybe we want more than one config? IDK..

/**
 * Application extension that calls certain overridable (lifecycle) methods in a defined order, before
 * starting/testing/using the App.
 * The main idea is to differentiate between phases for loading the plugins, setting and validating the env variables,
 * create the configs, and init the app
 */
export abstract class LifecycleApp extends App {
  //h4bff App shouldnt have loadPlugins
  protected abstract getEnvConfig(): EnvConfigClass;
  protected abstract registerPlugins(): Plugin[];
  protected abstract init(): void;
  protected abstract start(): void;

  private pluginRegistry: Plugin[] = [];

  /**
   * Prepares the app and runs the start() method.
   */
  runApp() {
    this.prepare();
    this.start();
    return this;
  }

  /**
   * Prints a description of how the Envirionment Configuration should look like.
   */
  help() {
    const envConfig = this.getSingleton(Envaridator);
    console.error(`Env config:\n${envConfig.describeAll()}\n\n`);
  }

  private validateEnv() {
    const envConfig = this.getSingleton(Envaridator);
    try {
      envConfig.validate();
    } catch (e) {
      console.error(e);
      console.error(`Env config:\n${envConfig.describeAll()}\n\n`);
      process.exit(1);
    }
  }

  /**
   * Executes all the needed steps to start() the app.
   */
  prepare() {
    this.registerPlugins().forEach(plugin => {
      this.pluginRegistry.push(plugin);
    });
    this.load(this.getEnvConfig());
    this.pluginRegistry.forEach(plugin => {
      if (!!plugin.config) {
        this.load(plugin.config);
      }
    });
    this.validateEnv();
    this.init();
    this.pluginRegistry.forEach(plugin => plugin.init(this));
    return this;
  }
}
