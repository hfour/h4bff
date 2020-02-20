[Home](/) &gt; [@h4bff/frontend](../frontend.md) &gt; [injectContextApp](injectContextApp.md)

## injectContextApp() function

Use this decorator to inject the app into a component by means of React Context. Once used on a component, the app is available as a property on the component class i.e. `this.app`<!-- -->. You will need to declare the existence property separately - the decorator cannot modify the properties of the class.

Once the app is available, you can access any singletons or transients.

<b>Signature:</b>

```typescript
export declare function injectContextApp(componentClass: Function): void;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  componentClass | <code>Function</code> |  |

<b>Returns:</b>

`void`

#### Example


```typescript
@injectContextApp
class MyComponent extends React.Component {
  private app!: App;
}

```

