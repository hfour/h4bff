[Home](/) &gt; [@h4bff/core](../core.md) &gt; [App](App.md)

## App class

Represents an H4BFF application, the central hub of h4bff. Its the class that loads and initializes all the plugins, storing instances of their singletons in the singleton locator, as well as creating new service contexts which keep per-request service locators.

#### Remarks

When creating a new backend or frontend application, typically you would inherit from this class, adding a few methods such as `start` and `loadPlugins`

You can also use this class in your plugin tests to create a fake, controlled application environment. Services and singletons in this environment can be overridden using the overrideService and overrideSingleton methods, in order to more easily test plugins in isolation.

Applications are hierarchical. An app can contain multiple child applications. This is useful if for example you want to have two RPC endpoints, internal and external - but you want both apps to share a single database access layer. You would load the database access layer in the parent, while the individual routes get set up in the child apps created with `app.createChildApp`

The App class does not currently propose any specific lifecycle. A typical application would probably have a configuration method and a loadPlugins method.

The configuration method will get any configuration singletons and set up any necessary values in them. For example, a configuration singleton of a backend plugin might specify the needed environment variables.

Then, the `loadPlugins` method would actually load all the plugins, which should setup router routes, event hooks, RPC endpoints (for backend apps) and so on.

<b>Signature:</b>

```typescript
export declare class App 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [parentApp](App.md#parentapp) | <code>App &#124; null</code> |  |

### parentApp

<b>Signature:</b>

```typescript
parentApp: App | null;
```

## Methods

|  Method | Description |
|  --- | --- |
|  [clearServiceOverrides()](App.md#clearserviceoverrides) | Clears any defined service overrides. |
|  [clearSingletonOverrides()](App.md#clearsingletonoverrides) | Clears any defined singleton overrides. |
|  [clearTransientOverrides()](App.md#cleartransientoverrides) | Clears any defined transient overrides. |
|  [createChildApp()](App.md#createchildapp) | When instantiating singletons, child applications look in their parents for already instantiated singletons, returning them if they exists.<!-- -->Services and the service context are not affected by parent / child hierarchies.<!-- -->Use this when you want to initialize the same kind of a singleton multiple times. |
|  [createTransient(Klass)](App.md#createtransient) | Creates a new Transient instance of the specified class. The instance is constructed on every createTransient request. If using a getter, be sure to use memoization, otherwise the transient will be recreated on every call of the getter |
|  [getSingleton(Klass)](App.md#getsingleton) | Returns an instance of the singleton, if it exists somewhere here or in some of the parent apps. If it doesn't it's created in this app.<!-- -->This method can also be used to initialize a class somewhere specific in the hierarchy of apps, for example in the parent app, to prevent it from being initialized in a child later on. |
|  [hasSingleton(Klass)](App.md#hassingleton) | Checks if this or any of the parent apps has an instance of the given singleton initialized. Plugins can use this to check if their configuration singletons have been loaded before they have. |
|  [load(Klass)](App.md#load) | Loads the plugin, which forces its initialization.<!-- -->While singleton classes are typically side effect free and can be instantiated lazily when first requested, plugins have side-effects, such as adding router routes, adding RPC endpoints or setting up event listeners. The load method is therefore used to load those plugins. |
|  [loadPlugins()](App.md#loadplugins) | Override this method to load plugins in your app.<!-- -->TODO: describe why it's important to load plugins when configuring an application; also how it differs from starting the application -- the other kind of side-effects. |
|  [overrideService(Klass, Klass2)](App.md#overrideservice) | Allows you to specify an alternative implementation for the expected service. Each time someone tries to instantiate the specified class / fn, the override is used instead. The type of the override must match that of the original class / fn.<!-- -->This method is typically useful in tests to test plugins in isolation by providing mock or fake dependencies. |
|  [overrideSingleton(Klass, Klass2)](App.md#overridesingleton) | Allows you to specify an alternative implementation for the expected singleton. Each time someone tries to instantiate the specified class / fn, the override is used instead. The type of the override must match that of the original class / fn.<!-- -->This method is typically useful in tests to test plugins in isolation by providing mock or fake dependencies. |
|  [overrideTransient(Klass, Klass2)](App.md#overridetransient) | Allows you to specify an alternative implementation for the expected transient. Each time someone tries to instantiate the specified class / fn, the override is used instead. The type of the override must match that of the original class / fn.<!-- -->This method is typically useful in tests to test plugins in isolation by providing mock or fake dependencies. |
|  [withServiceContext(f)](App.md#withservicecontext) | Creates a service context, executes the provided function and disposes of the context afterwards. Disposal happens regardless of exceptions. See [ServiceContext](ServiceContext.md) for more info on what a service context is, and [ServiceContextEvents](ServiceContextEvents.md) for more info on disposal. |

### clearServiceOverrides

Clears any defined service overrides.

<b>Signature:</b>

```typescript
clearServiceOverrides(): void;
```
<b>Returns:</b>

`void`

### clearSingletonOverrides

Clears any defined singleton overrides.

<b>Signature:</b>

```typescript
clearSingletonOverrides(): void;
```
<b>Returns:</b>

`void`

### clearTransientOverrides

Clears any defined transient overrides.

<b>Signature:</b>

```typescript
clearTransientOverrides(): void;
```
<b>Returns:</b>

`void`

### createChildApp

When instantiating singletons, child applications look in their parents for already instantiated singletons, returning them if they exists.

Services and the service context are not affected by parent / child hierarchies.

Use this when you want to initialize the same kind of a singleton multiple times.

<b>Signature:</b>

```typescript
createChildApp(): App;
```
<b>Returns:</b>

`App`

### createTransient

Creates a new Transient instance of the specified class. The instance is constructed on every createTransient request. If using a getter, be sure to use memoization, otherwise the transient will be recreated on every call of the getter

<b>Signature:</b>

```typescript
createTransient<T>(Klass: ConstructorOrFactory<App, T>): T;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  Klass | <code>ConstructorOrFactory&lt;App, T&gt;</code> |  |

<b>Returns:</b>

`T`

### getSingleton

Returns an instance of the singleton, if it exists somewhere here or in some of the parent apps. If it doesn't it's created in this app.

This method can also be used to initialize a class somewhere specific in the hierarchy of apps, for example in the parent app, to prevent it from being initialized in a child later on.

<b>Signature:</b>

```typescript
getSingleton<T>(Klass: ConstructorOrFactory<App, T>): T;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  Klass | <code>ConstructorOrFactory&lt;App, T&gt;</code> |  |

<b>Returns:</b>

`T`

### hasSingleton

Checks if this or any of the parent apps has an instance of the given singleton initialized. Plugins can use this to check if their configuration singletons have been loaded before they have.

<b>Signature:</b>

```typescript
hasSingleton<T>(Klass: ConstructorOrFactory<App, T>): boolean;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  Klass | <code>ConstructorOrFactory&lt;App, T&gt;</code> |  |

<b>Returns:</b>

`boolean`

### load

Loads the plugin, which forces its initialization.

While singleton classes are typically side effect free and can be instantiated lazily when first requested, plugins have side-effects, such as adding router routes, adding RPC endpoints or setting up event listeners. The load method is therefore used to load those plugins.

<b>Signature:</b>

```typescript
load<T>(Klass: ConstructorOrFactory<App, T>): void;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  Klass | <code>ConstructorOrFactory&lt;App, T&gt;</code> |  |

<b>Returns:</b>

`void`

### loadPlugins

Override this method to load plugins in your app.

TODO: describe why it's important to load plugins when configuring an application; also how it differs from starting the application -- the other kind of side-effects.

<b>Signature:</b>

```typescript
loadPlugins(): void;
```
<b>Returns:</b>

`void`

### overrideService

Allows you to specify an alternative implementation for the expected service. Each time someone tries to instantiate the specified class / fn, the override is used instead. The type of the override must match that of the original class / fn.

This method is typically useful in tests to test plugins in isolation by providing mock or fake dependencies.

<b>Signature:</b>

```typescript
overrideService<T>(Klass: ConstructorOrFactory<ServiceContext, T>, Klass2: ConstructorOrFactory<ServiceContext, PublicInterface<T>>): void;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  Klass | <code>ConstructorOrFactory&lt;ServiceContext, T&gt;</code> |  |
|  Klass2 | <code>ConstructorOrFactory&lt;ServiceContext, PublicInterface&lt;T&gt;&gt;</code> |  |

<b>Returns:</b>

`void`

### overrideSingleton

Allows you to specify an alternative implementation for the expected singleton. Each time someone tries to instantiate the specified class / fn, the override is used instead. The type of the override must match that of the original class / fn.

This method is typically useful in tests to test plugins in isolation by providing mock or fake dependencies.

<b>Signature:</b>

```typescript
overrideSingleton<T>(Klass: ConstructorOrFactory<App, T>, Klass2: ConstructorOrFactory<App, PublicInterface<T>>): void;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  Klass | <code>ConstructorOrFactory&lt;App, T&gt;</code> |  |
|  Klass2 | <code>ConstructorOrFactory&lt;App, PublicInterface&lt;T&gt;&gt;</code> |  |

<b>Returns:</b>

`void`

### overrideTransient

Allows you to specify an alternative implementation for the expected transient. Each time someone tries to instantiate the specified class / fn, the override is used instead. The type of the override must match that of the original class / fn.

This method is typically useful in tests to test plugins in isolation by providing mock or fake dependencies.

<b>Signature:</b>

```typescript
overrideTransient<T>(Klass: ConstructorOrFactory<App, T>, Klass2: ConstructorOrFactory<App, PublicInterface<T>>): void;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  Klass | <code>ConstructorOrFactory&lt;App, T&gt;</code> |  |
|  Klass2 | <code>ConstructorOrFactory&lt;App, PublicInterface&lt;T&gt;&gt;</code> |  |

<b>Returns:</b>

`void`

### withServiceContext

Creates a service context, executes the provided function and disposes of the context afterwards. Disposal happens regardless of exceptions. See [ServiceContext](ServiceContext.md) for more info on what a service context is, and [ServiceContextEvents](ServiceContextEvents.md) for more info on disposal.

<b>Signature:</b>

```typescript
withServiceContext<T>(f: (createdCtx: ServiceContext) => PromiseLike<T>): Promise<T>;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  f | <code>(createdCtx: ServiceContext) =&gt; PromiseLike&lt;T&gt;</code> |  |

<b>Returns:</b>

`Promise<T>`

