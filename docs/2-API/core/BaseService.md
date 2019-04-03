[Home](/) &gt; [@h4bff/core](../core.md) &gt; [BaseService](BaseService.md)

## BaseService class

<b>Signature:</b>

```typescript
export declare class BaseService 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [\_\_baseService](BaseService.md#__baseservice) | <code>boolean</code> |  |
|  [\_factory](BaseService.md#_factory) | <code>any</code> |  |
|  [context](BaseService.md#context) | <code>ServiceContext</code> |  |
|  [factory](BaseService.md#factory) | <code>any</code> |  |

### \_\_baseService

<b>Signature:</b>

```typescript
protected static __baseService: boolean;
```

### \_factory

<b>Signature:</b>

```typescript
static _factory: any;
```

### context

<b>Signature:</b>

```typescript
protected context: ServiceContext;
```

### factory

<b>Signature:</b>

```typescript
static readonly factory: any;
```

## Methods

|  Method | Description |
|  --- | --- |
|  [getService(SvcClass)](BaseService.md#getservice) | Proxy for <code>serviceContext.getService(Klass)</code>. |
|  [getSingleton(SingletonClass)](BaseService.md#getsingleton) | Proxy for <code>app.getSingleton(Klass)</code>. |

### getService

Proxy for `serviceContext.getService(Klass)`<!-- -->.

<b>Signature:</b>

```typescript
getService<T extends BaseService>(SvcClass: {
        new (sc: ServiceContext): T;
    }): T;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  SvcClass | <code>{`<p/>`        new (sc: ServiceContext): T;`<p/>`    }</code> |  |

<b>Returns:</b>

`T`

### getSingleton

Proxy for `app.getSingleton(Klass)`<!-- -->.

<b>Signature:</b>

```typescript
getSingleton<T>(SingletonClass: ConstructorOrFactory<App, T>): T;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  SingletonClass | <code>ConstructorOrFactory&lt;App, T&gt;</code> |  |

<b>Returns:</b>

`T`

