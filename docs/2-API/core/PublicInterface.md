[Home](/) &gt; [@h4bff/core](../core.md) &gt; [PublicInterface](PublicInterface.md)

## PublicInterface type

<b>Signature:</b>

```typescript
export declare type PublicInterface<T> = {
    [K in keyof T]: T[K];
};
```
