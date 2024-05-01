# 试试RPCs的新玩法
> 比较典型的玩法:RPC数据流从客户端流向服务端，现在来尝试用`IceRPC`来玩一个新的花样。


## 概述
> 对于 IceRPC，客户端是发起连接的实体， 而服务器是接受连接的实体。

建立连接后，通常会从客户端到服务端生成RPCs通道:

1. 客户端创建请求，并将该请求发送到服务器
2. 服务端接受此请求，并将此请求发送到已提供的`服务实现`
3. 服务端返回响应，IceRPC 将此响应带回客户端

![A RPC from client to server](https://zeroc。com/blogs/other-way-around/rpc-from-client-to-server.svg)

IceRPC 提供的几乎所有示例，都是这个客户端到服务器的模式。尽管如此，我们可以使用 IceRPC 试试另一种发送方式。


## 获取调用器`invoker`
> 使用IceRPC，需要一个调用器`invoker`来发送请求，并接收相应的响应。 IceRPC（C#）提供了 ClientConnection 和 ConnectionCache 类， 用来建立网络连接的两个"终端"调用器`invoker`。 当使用这些调用器之一发送请求时， 请求会从底层连接的客户端，传输到服务器端。

"终端"调用器是实际发送请求，并接收响应的调用器`invoker`。 相比之下,管道`Pipeline`和拦截器`interceptors`是非终端调用器: 他们处理请求和响应,但需要实际的调用者,来完成这项工作。

服务端到客户端调用所需的调用器`invoker`是 `IConnectionContext.Invoker`。 从传入请求中检索`封闭连接上下文`。 如下所示:

```csharp

// In a dispatcher implementation
public ValueTask<OutgoingResponse> DispatchAsync(
    IncomingRequest request,
    CancellationToken cancellationToken)
{
    // The invoker represents the connection over which we received this request.
    IInvoker invoker = request.ConnectionContext.Invoker;
    ...
}
```

If you are implementing your IceRPC service using Slice， you need to install the Dispatch information middleware in your dispatch pipeline to expose this connection context as part of the `IDispatchInformationFeature`。 For example:

```csharp

// Router setup in composition root / main Program
Router router = new Router()
    .UseDispatchInformation()
    .Map<IGreeterService>(new Chatbot());

// Slice Service implementation
public ValueTask<string> GreetAsync(
    string name,
    IFeatureCollection features,
    CancellationToken cancellationToken)
{
    IDispatchInformationFeature? dispatchInfo = features.Get<IDispatchInformationFeature>();
    Debug.Assert(dispatchInfo is not null); // installed by the DispatchInformation middleware

    // The invoker represents the connection over which we received this Greet request.
    IInvoker invoker = dispatchInfo.ConnectionContext.Invoker;
    ...
}
```

Then， once you have a terminal invoker， you can send requests using this invoker。 If you use Slice， you would construct a Slice proxy with this invoker and then call operations using this proxy。 For example:

```csharp

IInvoker invoker = ...; // some invoker
var alarm = new AlarmProxy(invoker); // use Alarm's default path.
await alarm.SomeOpAsync();

```

## Push notification use-case
> A common use-case for making RPCs the other way around is push notifications: a client wants to receive a notification from the server when some event occurs in the server (a "push" from the server)。 It does not want to send requests periodically to check if this event occurred (this would be a "pull")。

The server can't open a connection to the client (due to a firewall or other network constraints)， so we want to use the existing client-to-server connection for these notifications。

![Push notification example](https://zeroc。com/blogs/other-way-around/push-notification-example.svg)

We can model this interaction with the following Slice interfaces:

```slice

// Implemented by a service in the client
interface Alarm {
    abnormalTemperature(value: float32) -> string
}

// Implemented by a service in the server
interface Sensor {
    getCurrentTemperature() -> float32

    // Monitors the current temperature and calls `abnormalTemperature` on Alarm when the
    // current temperature moves outside [low..high].
    monitorTemperature(low: float32, high: float32)
}

```

And implement the Sensor service as follows:

```csharp

// Implementation of Sensor service
public ValueTask MonitorTemperatureAsync(
    float low,
    float high,
    IFeatureCollection features,
    CancellationToken cancellationToken)
{
    IDispatchInformationFeature? dispatchInfo = features.Get<IDispatchInformationFeature>();
    Debug.Assert(dispatchInfo is not null); // installed by DispatchInformation middleware

    // We use Alarm's default path for this proxy.
    var alarm = new AlarmProxy(dispatchInfo.ConnectionContext.Invoker);

    // We enqueue the information and monitor the temperature in a separate task.
    _monitor.Add(low, high, alarm);
}

```

In the client， we implement the Alarm service， map it inside a Router and then set the dispatcher in the options of our ClientConnection:

```csharp

// Client side
Router router = new Router.Map<IAlarmService>(new PopupAlarm()); // use Alarm's default path.

await using var connection = new ClientConnection(
    new ClientConnectionOptions
    {
        Dispatcher = router, // client-side dispatcher
        ServerAddress = new ServerAddress(new Uri("icerpc://..."))
    });

// Use connection as usual to create a SensorProxy and call MonitorTemperatureAsync.

[SliceService]
internal partial class PopupAlarm : IAlarmService
{
    public ValueTask<string> AbnormalTemperatureAsync(
        float value,
        IFeatureCollection features,
        CancellationToken cancellationToken)
    {
        // Show a popup with the abnormal temperature.
        ...
        return new("Roger"); // acknowledge alarm
    }
}

```

## Low level invoker
>The invoker provided by a connection context is a "raw" invoker tied to a particular network connection。 If the network connection is closed for any reason， this invoker is no longer usable。 When you use such an invoker， you need to handle such connection failures yourself。 `ClientConnection` and `ConnectionCache` are easier to use since they reestablish the underlying connections as needed。

## Alternative: Stream pulls
RPC frameworks based on HTTP， such as gRPC， can't make RPCs the other way around， so surely there is an alternative!

If you can't push notifications to your client， you can pull these notifications from the client。 It uses about the same number of bytes on the network， but is much less elegant。 For example:

```slice

// Implemented by a service in the server
interface Sensor {
    getCurrentTemperature() -> float32

    // Monitors the current temperature and streams back any value outside
    // the acceptable range.
    monitorTemperature(low: float32, high: float32) -> stream float32
}

```

With this approach， the client iterates over the stream returned by monitorTemperature: each new value is a new notification。

## Unique advantage: Acknowledgment
> The unique advantage of making a RPC "the other around" is you can get a response。 This response tells the caller the request was delivered and processed successfully by the service in the client。

If you merely stream responses back to your client， the server doesn't get any acknowledgment: it knows it produced the stream element， it may know this element was written successfully to the network， but it doesn't know if the client received and processed this element successfully。

Essentially， stream responses are comparable to one-way requests from the server to the client: the syntax is different but there is no functional difference。 On the other hand， a stream response can't emulate two-way RPCs from server to client。

## Cloud routing use-case
> Another use-case for making RPCs from server to client is routing via a cloud service， as illustrated by the [Thermostat] example。

This example is a very simplified version of a common real-world conundrum: you have a client application (like a mobile app) that needs to communicate with a device (like a thermostat)。 This device is behind a firewall and does not accept incoming connections。 How do you establish this communication?

The solution is to introduce an intermediary server that both the client and the device connect to。 This server is typically deployed "in the cloud" and routes requests from the client to the device (and vice-versa， if desired)。 A request from the client to the device flows over the client-to-server connection and then over the server-to-device connection。 This works very well this IceRPC:

![Thermostat example](https://zeroc。com/blogs/other-way-around/thermostat-example.svg)

With this example， the client can change the set point on the thermostat， and wait for an acknowledgment from the thermostat: either "ok" or a failure—for example， because the specified set point is too low:

![Thermostat client](https://zeroc。com/_next/image?url=%2Fblogs%2Fother-way-around%2Fthermostat-client。png&w=1200&q=75)

The Thermostat example implements its own terminal invoker in the server， the DeviceConnection class:

```csharp

/// <summary>Represents the server-side of the connection from the device to this server. This
/// connection remains valid across re-connections from the device.</summary>
internal class DeviceConnection : IInvoker
{
    private volatile IInvoker? _invoker;

    public async Task<IncomingResponse> InvokeAsync(
        OutgoingRequest request,
        CancellationToken cancellationToken = default)
    {
        if (_invoker is IInvoker invoker)
        {
            try
            {
                return await invoker.InvokeAsync(request, cancellationToken);
            }
            catch (ObjectDisposedException)
            {
                // throw NotFound below
            }
        }
        throw new DispatchException(StatusCode.NotFound, "The device is not connected.");
    }

    /// <summary>Sets the invoker that represents the latest connection from the device.</summary>
    internal void SetInvoker(IInvoker invoker) => _invoker = invoker;
}

```

A device connection represents the latest connection from the device to the server。 It's useful to have such a terminal invoker that survives re-connections: it allows the Thermostat server to create a Pipeline and proxies that don't need to be recreated each time the device reconnects。

## Conclusion
Making RPCs the other way around is a powerful feature that sets IceRPC apart from other RPC frameworks。 You can take advantage of this feature to build networked applications with meaningful semantics that work well across firewalls。

[Thermostat]: https://github。com/xlgwr/icerpc-csharp/tree/main/examples/slice/Thermostat
