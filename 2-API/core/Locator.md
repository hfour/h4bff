[Home](/) &gt; [@h4bff/core](../core.md) &gt; [Locator](Locator.md)

## Locator class

<b>Signature:</b>

```typescript
export declare class Locator<Context> 
```

## Methods

|  Method | Description |
|  --- | --- |
|  [clearOverrides()](Locator.md#clearoverrides) |  |
|  [get(f)](Locator.md#get) |  |
|  [has(f)](Locator.md#has) |  |
|  [override(f, g)](Locator.md#override) |  |
|  [withNewContext(ctx)](Locator.md#withnewcontext) |  |

### clearOverrides

<b>Signature:</b>

```typescript
clearOverrides(): void;
```
<b>Returns:</b>

`void`

### get

<b>Signature:</b>

```typescript
get<T>(f: ConstructorOrFactory<Context, T>): T;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  f | <code>ConstructorOrFactory&lt;Context, T&gt;</code> |  |

<b>Returns:</b>

`T`

### has

<b>Signature:</b>

```typescript
has<T>(f: ConstructorOrFactory<Context, T>): boolean;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  f | <code>ConstructorOrFactory&lt;Context, T&gt;</code> |  |

<b>Returns:</b>

`boolean`

### override

<b>Signature:</b>

```typescript
override<T>(f: ConstructorOrFactory<Context, T>, g: ConstructorOrFactory<Context, T>): void;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  f | <code>ConstructorOrFactory&lt;Context, T&gt;</code> |  |
|  g | <code>ConstructorOrFactory&lt;Context, T&gt;</code> |  |

<b>Returns:</b>

`void`

### withNewContext

<b>Signature:</b>

```typescript
withNewContext(ctx: Context): Locator<Context>;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  ctx | <code>Context</code> |  |

<b>Returns:</b>

`Locator<Context>`

