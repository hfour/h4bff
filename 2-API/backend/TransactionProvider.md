[Home](/) &gt; [@h4bff/backend](../backend.md) &gt; [TransactionProvider](TransactionProvider.md)

## TransactionProvider class

Provides transaction instance to support transactional behavior within service context. It there is no existing transaction present in the current service context, it creates it. Can be used within a service implementation or where there is a  instance available.

<b>Signature:</b>

```typescript
export declare class TransactionProvider extends BaseService 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [conn](TransactionProvider.md#conn) | <code>Transaction &#124; import(&quot;anydb-sql-2&quot;).AnyDBPool</code> |  |
|  [tx](TransactionProvider.md#tx) | <code>Transaction</code> |  |

### conn

<b>Signature:</b>

```typescript
readonly conn: Transaction | import("anydb-sql-2").AnyDBPool;
```

### tx

<b>Signature:</b>

```typescript
readonly tx: Transaction;
```

## Methods

|  Method | Description |
|  --- | --- |
|  [onDispose(error)](TransactionProvider.md#ondispose) | Gets called on context disposal and makes sure that the transaction is disposed properly. If an error occured it rollbacks the transaction, otherwise it commits it. |

### onDispose

Gets called on context disposal and makes sure that the transaction is disposed properly. If an error occured it rollbacks the transaction, otherwise it commits it.

<b>Signature:</b>

```typescript
onDispose(error: Error | null): Promise<void>;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  error | <code>Error &#124; null</code> |  |

<b>Returns:</b>

`Promise<void>`

