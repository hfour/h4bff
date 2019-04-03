[Home](/) &gt; [@h4bff/core](../core.md) &gt; [AppSingleton](AppSingleton.md)

## AppSingleton class

<b>Signature:</b>

```typescript
export declare class AppSingleton 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [\_\_appSingleton](AppSingleton.md#__appsingleton) | <code>boolean</code> |  |
|  [app](AppSingleton.md#app) | <code>App</code> |  |

### \_\_appSingleton

<b>Signature:</b>

```typescript
protected static __appSingleton: boolean;
```

### app

<b>Signature:</b>

```typescript
protected app: App;
```

## Methods

|  Method | Description |
|  --- | --- |
|  [getSingleton(Klass)](AppSingleton.md#getsingleton) | A proxy for <code>app.getSingleton(Klass)</code>. |

### getSingleton

A proxy for `app.getSingleton(Klass)`<!-- -->.

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

