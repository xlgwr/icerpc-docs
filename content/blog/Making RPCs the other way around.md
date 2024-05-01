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

"终端"调用器是实际发送请求，并接收响应的调用器`invoker`。 相比之下，管道`Pipeline`和拦截器`interceptors`是非终端调用器：他们处理请求和响应,但需要实际的调用者,来完成这项工作。

服务端到客户端调用所需的调用器`invoker`是 `IConnectionContext.Invoker`。 从传入请求中检索`连接上下文`。 如下所示：

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

如果正在使用 Slice 实施 IceRPC 服务， 需要在调度管道中，安装调度信息中间件`UseDispatchInformation()`,以将此`连接上下文`公开为  `IDispatchInformationFeature` 的一部分。 如下所示：

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

然后，一旦有了终端调用器，就可以使用该调用器发送请求。 如果使用 Slice，将使用此调用器构建 Slice 代理,然后使用此代理调用操作。 如下所示：

```csharp

IInvoker invoker = ...; // some invoker
var alarm = new AlarmProxy(invoker); // use Alarm's default path.
await alarm.SomeOpAsync();

```

## 推送通知用例

> 使用IceRPC开发推送通知功能: 当服务端中发生某些事件时（从服务端"推送`push`"）,客户端希望收到来自服务端的通知。 它不想定期发送请求，来检查是否发生此事件（"拉取`pull`"）。

服务器无法打开与客户端的连接（由于防火墙或其他网络限制）， 因此,我们希望使用现有的客户端到服务器连接来执行这些通知。

![Push notification example](https://zeroc。com/blogs/other-way-around/push-notification-example.svg)

我们可以使用以下 Slice 接口对这种交互进行模拟:

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

并实现传感器`Sensor`服务如下:

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

在客户端中,我们实现警报`Alarm`服务,将其映射到路由器`Router`内,然后在客户端连接的选项中设置调度程序`ClientConnection`:

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

## 底层调用器`invoker`

>`连接上下文`提供的调用器是绑定到特定网络连接的"原始"调用器。 如果网络连接因任何原因关闭，则该调用器将不再可用。 当使用此类调用器时,需要自己处理此类连接故障。 `ClientConnection` 和 `ConnectionCache`更易于使用,因为它们可以根据需要，重建底层连接。

## 替代方案:字节流拉动`Stream pulls`

基于 HTTP 的 RPC 框架,比如 gRPC,不能让 RPC 反过来推送,这里还有一个替代方案！

如果无法将通知推送到客户端,可以从客户端拉取这些通知。 它在网络上使用大约相同数量的字节,但要不优雅。 如下所示：

```slice

// Implemented by a service in the server
interface Sensor {
    getCurrentTemperature() -> float32

    // Monitors the current temperature and streams back any value outside
    // the acceptable range.
    monitorTemperature(low: float32, high: float32) -> stream float32
}

```

通过这种方法，客户端会迭代 monitorTemperature 返回的流:每个新值都是一个新通知。

## 独特优势

> RPC可以得到另一方式的回应。 该回应告诉调用者`caller`，请求已由客户端中的服务，成功发送和处理。

如果只是将回应流`stream responses`回您的客户端， 服务器不用任何确认: 它就知道产生了回应流,也可能知道该流已成功通过了网络，但它不知道客户端是否成功接收并处理了该流。

本质上,流响应类似于从服务器到客户端的单向请: 语法不同,但没有功能差异。另一方面,流响应无法模拟从服务器到客户端的双向 RPC。

## 云路由用例（分布式）

> 从服务器到客户端制作 RPC 的另一个用例是通过云服务路由， 如图所示 [Thermostat] 例子。

这个例子是现实世界中，常见难题的一个简化版本: 比如你有一个客户端应用 (像手机应用app) 需要连接一个设备 (比如恒温器`thermostat`)。 该设备位于防火墙后面,不接受传入连接。 如何建立彼此通信呢?

解决方案：引入客户端和设备都连接的中介服务器。 该服务器通常部署在"云中",并将请求从客户端路由到设备（反之亦然,如果需要）。 从客户端到设备的请求，通过客户端到服务器的连接,然后通过服务器到设备的连接。 这种方式对 IceRPC 来说，非常好处理:

![Thermostat example](https://zeroc。com/blogs/other-way-around/thermostat-example.svg)

通过此示例,客户端可以更改恒温器`thermostat`上的设定点,并等待恒温器的确认:例如"确定"或故障—,因为指定的设定点太低:

![Thermostat client](https://zeroc。com/_next/image?url=%2Fblogs%2Fother-way-around%2Fthermostat-client.png&w=1200&q=75)

恒温器`Thermostat`示例在服务器 `DeviceConnection` 类中实现自己的终端调用器

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

设备连接:从设备到服务器的最新连接。 拥有一个，在连接中留下来的终端调用器非常有用: 它允许恒温器服务器创建管道和代理,无需每次设备重新连接时，重新创建。

## 结论

反向调用生成 RPC 是一个强大的功能,是 IceRPC 与其他 RPC 框架区分的主要功能。 可以利用此功能构建，具有有意义的语义的网络应用程序,而且这些应用程序可以在防火墙上开心地正常工作。

[Thermostat]: https://github。com/xlgwr/icerpc-csharp/tree/main/examples/slice/Thermostat
