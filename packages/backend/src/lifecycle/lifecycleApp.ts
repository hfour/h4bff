import { App } from '@h4bff/core';
import { EnvConfig } from './config';

type PluginClass = { new (app: LifecycleApp): Plugin };

export interface Lifecycle {
  registerEnvironmentVars(): void;
  init(): void;
}

/**
 * Plugins should be distinct parts that add a feature to the App.
 * Proper way to use them is to add them to a LifecycleApp, by including them in the overridden loadPlugins() method,
 * by calling registerPlugin(Plugin).
 */
export abstract class Plugin implements Lifecycle {
  /**
   * Override this method to setup any envirionment variables the plugin might need.
   */
  registerEnvironmentVars() {}

  /**
   * Override this method to insert the plugins feature(s) in the App.
   */
  abstract init(): void;

  constructor(protected app: App) {}
}

/**
 * Application extension that calls certain overridable (lifecycle) methods in a defined order, before
 * starting/testing/using the App.
 * The main idea is to differentiate between phases for loading the plugins, setting and validating the env variables,
 * create the configs, and init the app
 */
export abstract class LifecycleApp extends App implements Lifecycle {
  abstract registerEnvironmentVars(): void;
  abstract loadPlugins(): void;
  abstract start(): void;

  private pluginRegistry: Map<PluginClass, Plugin> = new Map();

  constructor() {
    super();
    this.loadPlugins();
    this.registerEnvironmentVars();
    this.pluginRegistry.forEach(plugin => plugin.registerEnvironmentVars());
  }

  /**
   * Prepares the app and runs the start() method.
   */
  runApp() {
    this.prepareForStart();
    this.start();
    return this;
  }

  /**
   * Prints a description of how the Envirionment Configuration should look like.
   */
  help() {
    const envConfig = this.getSingleton(EnvConfig);
    console.error(`Env config:\n${envConfig.describeAll()}\n\n`);
  }

  /**
   * Optional method that can be overridden for any initialization that has to take part before the start() method.
   * TODO: check whether its redundant, and delete it if thats the case.
   */
  init() {}

  /**
   * Instantiates the given plugin, and introduces it to the lifecycle of the app (which means that its lifecycle
   * methods will be called along those of the Lifecycle App)
   */
  registerPlugin(pluginClass: PluginClass) {
    const plugin = new pluginClass(this);
    this.pluginRegistry.set(pluginClass, plugin);
  }

  private validateEnv() {
    const envConfig = this.getSingleton(EnvConfig);
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
  prepareForStart() {
    this.validateEnv();
    this.init();
    this.pluginRegistry.forEach(plugin => plugin.init());
    return this;
  }
}
