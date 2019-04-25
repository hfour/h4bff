[Home](/) &gt; [@h4bff/core](../core.md) &gt; [BaseService](BaseService.md)

## BaseService class

Derive from this class to create H4BFF services.

Services are classes that are instantiated and operate within an "isolated" service context, and are instantiated separately within each context, as opposed to singletons which have only one instance within an App.

#### Remarks

Examples of classes that should derive from `BaseService`<!-- -->:

\* Request: holds a reference to the HTTP request that triggered the service context creation

\* Transaction: a single transaction that's shared between services that operate throughout the duration of a single request.

\* UserInfo: information about the current user (known through req.session.id)

<b>Signature:</b>

```typescript
export declare class BaseService 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [context](BaseService.md#context) | <code>ServiceContext</code> |  |

### context

<b>Signature:</b>

```typescript
protected context: ServiceContext;
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

