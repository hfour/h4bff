[Home](/) &gt; [@h4bff/core](../core.md) &gt; [App](App.md)

## App class

<b>Signature:</b>

```typescript
export declare class App 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [parentApp](App.md#parentapp) | <code>App &#124; null</code> |  |
|  [singletonLocator](App.md#singletonlocator) | <code>Locator&lt;this&gt;</code> |  |

### parentApp

<b>Signature:</b>

```typescript
parentApp: App | null;
```

### singletonLocator

<b>Signature:</b>

```typescript
singletonLocator: Locator<this>;
```

## Methods

|  Method | Description |
|  --- | --- |
|  [createChildApp()](App.md#createchildapp) | When instatiating singletons, child applications look in their parents for already instantiated singletons, returning them if they exists.<!-- -->Services and the service context are not affected by parent / child hierarchies.<!-- -->Use this when you want to initialize the same kind of a singleton multiple times. |
|  [createServiceContext()](App.md#createservicecontext) | Creates a service context.<!-- -->See the documentation for <code>ServiceContext</code> for more details. |
|  [getSingleton(Klass)](App.md#getsingleton) | Returns an instance of the singleton, if it exists somewhere here or in some of the parent apps. If it doesn't it's created in this app. |
|  [load(Klass)](App.md#load) | Loads the plugin, which forces its initialization.<!-- -->Use this when you want to initialize a class somewhere specific in the hierarchy of apps, for example in the parent app, to prevent it from being initalized in a child later on. |
|  [loadPlugins()](App.md#loadplugins) | Override this method to load plugins in your app.<!-- -->TODO: describe why it's important to load plugins when configuring an application; also how it differs from starting the application -- the other kind of side-effects. |
|  [overrideService(Klass, Klass2)](App.md#overrideservice) | Allows you to specify an alternative implementation for the expected service. Each time someone tries to instantiate the specified class / fn, the override is used instead. The type of the override must match that of the original class / fn. |
|  [overrideSingleton(Klass, Klass2)](App.md#overridesingleton) | Allows you to specify an alternative implementation for the expected singleton. Each time someone tries to instantiate the specified class / fn, the override is used instead. The type of the override must match that of the original class / fn. |
|  [withServiceContext(f)](App.md#withservicecontext) | Creates a service context, executes the provided function and disposes of the context afterwards. Disposal happens regardless of exceptions. |

### createChildApp

When instatiating singletons, child applications look in their parents for already instantiated singletons, returning them if they exists.

Services and the service context are not affected by parent / child hierarchies.

Use this when you want to initialize the same kind of a singleton multiple times.

<b>Signature:</b>

```typescript
createChildApp(): App;
```
<b>Returns:</b>

`App`

### createServiceContext

Creates a service context.

See the documentation for `ServiceContext` for more details.

<b>Signature:</b>

```typescript
createServiceContext(): ServiceContext;
```
<b>Returns:</b>

`ServiceContext`

### getSingleton

Returns an instance of the singleton, if it exists somewhere here or in some of the parent apps. If it doesn't it's created in this app.

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

### load

Loads the plugin, which forces its initialization.

Use this when you want to initialize a class somewhere specific in the hierarchy of apps, for example in the parent app, to prevent it from being initalized in a child later on.

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

### withServiceContext

Creates a service context, executes the provided function and disposes of the context afterwards. Disposal happens regardless of exceptions.

<b>Signature:</b>

```typescript
withServiceContext<T>(f: (createdCtx: ServiceContext) => PromiseLike<T>): PromiseLike<T>;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  f | <code>(createdCtx: ServiceContext) =&gt; PromiseLike&lt;T&gt;</code> |  |

<b>Returns:</b>

`PromiseLike<T>`

