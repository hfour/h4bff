[Home](/) &gt; [@h4bff/frontend](../frontend.md) &gt; [useStateTransient](useStateTransient.md)

## useStateTransient() function

Use a state transient - a substitute for observable properties embedded within a component class. Think of this as a react component class that has everything but the render method.

<b>Signature:</b>

```typescript
export declare function useStateTransient<T, U extends MobxStateTransientConstructor<T>>(Klass: U, props: T): InstanceType<U>;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  Klass | <code>U</code> |  |
|  props | <code>T</code> |  |

<b>Returns:</b>

`InstanceType<U>`

