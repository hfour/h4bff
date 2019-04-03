[Home](/) &gt; [@h4bff/frontend](../frontend.md) &gt; [LinkProps](LinkProps.md)

## LinkProps interface

<b>Signature:</b>

```typescript
export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [activeClassName](LinkProps.md#activeclassname) | <code>string</code> |  |
|  [activeStyle](LinkProps.md#activestyle) | <code>React.CSSProperties</code> |  |
|  [exact](LinkProps.md#exact) | <code>boolean</code> |  |
|  [innerRef](LinkProps.md#innerref) | <code>(node: HTMLAnchorElement &#124; null) =&gt; void</code> |  |
|  [location](LinkProps.md#location) | <code>Location</code> |  |
|  [replace](LinkProps.md#replace) | <code>boolean</code> |  |
|  [strict](LinkProps.md#strict) | <code>boolean</code> |  |
|  [to](LinkProps.md#to) | <code>LocationDescriptor</code> |  |

### activeClassName

<b>Signature:</b>

```typescript
activeClassName?: string;
```

### activeStyle

<b>Signature:</b>

```typescript
activeStyle?: React.CSSProperties;
```

### exact

<b>Signature:</b>

```typescript
exact?: boolean;
```

### innerRef

<b>Signature:</b>

```typescript
innerRef?: (node: HTMLAnchorElement | null) => void;
```

### location

<b>Signature:</b>

```typescript
location?: Location;
```

### replace

<b>Signature:</b>

```typescript
replace?: boolean;
```

### strict

<b>Signature:</b>

```typescript
strict?: boolean;
```

### to

<b>Signature:</b>

```typescript
to: LocationDescriptor;
```
