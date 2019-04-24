[Home](/) &gt; [@h4bff/frontend](../frontend.md) &gt; [Router](Router.md)

## Router class

Wrapper for the topmost router. It is singleton, which makes it accessible from throught the app, and is rendered within a history context provider.

<b>Signature:</b>

```typescript
export declare class Router extends AppSingleton 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [addRedirect](Router.md#addredirect) | <code>(newRedirect: Redirect) =&gt; void</code> |  |
|  [addRoute](Router.md#addroute) | <code>(path: string, component: (rp: {}) =&gt; JSX.Element) =&gt; void</code> |  |
|  [RenderInstance](Router.md#renderinstance) | <code>() =&gt; JSX.Element</code> |  |
|  [router](Router.md#router) | <code>MobxRouter</code> |  |

### addRedirect

<b>Signature:</b>

```typescript
addRedirect: (newRedirect: Redirect) => void;
```

### addRoute

<b>Signature:</b>

```typescript
addRoute: (path: string, component: (rp: {}) => JSX.Element) => void;
```

### RenderInstance

<b>Signature:</b>

```typescript
RenderInstance: () => JSX.Element;
```

### router

<b>Signature:</b>

```typescript
router: MobxRouter;
```
