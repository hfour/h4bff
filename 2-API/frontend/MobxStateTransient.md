[Home](/) &gt; [@h4bff/frontend](../frontend.md) &gt; [MobxStateTransient](MobxStateTransient.md)

## MobxStateTransient class

Use a MobX state transient as a substitute for observable properties embedded within a component class when using react hooks. You can migrate all properties and methods to the mobx state transient, keeping only the render function as a react component.

#### Remarks

MobX state transients have the following additional features

\* automatically disposable autorun - Use `this.autorun` to create an autorun which will be automatically cleared when the component that created the mobx state transient gets ummounted \* child transients - Use `this.createChild(StateTransient, params)` to create a child transient Child transients will automatically be disposed of once the parent transient is disposed.

<b>Signature:</b>

```typescript
export declare class MobxStateTransient<T> extends BaseTransient 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [props](MobxStateTransient.md#props) | <code>T</code> |  |

### props

<b>Signature:</b>

```typescript
props: T;
```

## Methods

|  Method | Description |
|  --- | --- |
|  [autoDispose(fn)](MobxStateTransient.md#autodispose) | Add a disposer to run when the original component gets unmounted |
|  [autorun(fn)](MobxStateTransient.md#autorun) | Crate a MobX autorun that will be automatically cancelled once the original component that invoked the transient gets unmounted |
|  [useStateTransient(Klass, props)](MobxStateTransient.md#usestatetransient) | Create a new child state transient with its own props. The child will be disposed of at the same time as the parent - typically when the component that created the original parent has unmounted. |

### autoDispose

Add a disposer to run when the original component gets unmounted

<b>Signature:</b>

```typescript
autoDispose(fn: () => void): void;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  fn | <code>() =&gt; void</code> |  |

<b>Returns:</b>

`void`

### autorun

Crate a MobX autorun that will be automatically cancelled once the original component that invoked the transient gets unmounted

<b>Signature:</b>

```typescript
autorun(fn: () => any): void;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  fn | <code>() =&gt; any</code> |  |

<b>Returns:</b>

`void`

### useStateTransient

Create a new child state transient with its own props. The child will be disposed of at the same time as the parent - typically when the component that created the original parent has unmounted.

<b>Signature:</b>

```typescript
useStateTransient<U, C extends MobxStateTransientConstructor<U>>(Klass: C, props: U): InstanceType<C>;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  Klass | <code>C</code> |  |
|  props | <code>U</code> |  |

<b>Returns:</b>

`InstanceType<C>`

