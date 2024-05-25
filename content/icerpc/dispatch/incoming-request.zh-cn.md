# 传入请求

> 了解如何处理传入的请求

## 接收传入的请求

调度器的调度方法接受传入的请求。该传入请求是由连接,在收到来自对等点的请求时创建的。

请求持有如下内容:

- 目标服务的路径
- 服务上的操作名称
- 请求字段
- 请求的有效负载`payload`

传入请求还包含功能`features`。这些功能用于该调度管道内的本地通信;它们还用于管道中的调度与应用程序代码之间的通信。

## 请求有效负载 `payload`

传入请求的有效负载是表示操作参数的字节流。`IceRPC` 而言,该流中的字节数是未知的。

## 请求功能

调度管道中的调度员在调度期间相互传输信息是很常见的。C# 中,这些调度获取并设置请求的 `IFeatureCollection` 用于这些通信。

还可以使用这些功能与服务代码进行通信。例如,如果安装调度信息中间件,它会设置 `IDispatchInformationFeature`,并且可以在代码中检索此功能:

```csharp
// In Slice service implementation
public ValueTask OpAsync(string message, FeatureCollection features, CancellationToken cancellationToken)
{
    if (features.Get<IDispatchInformationFeature> is IDispatchInformationFeature dispatchInformation)
    {
        EndPoint from = dispatchInformation.ConnectionContext.TransportConnectionInformation.RemoteNetworkAddress;
        Console.WriteLine($"dispatching request from {from}");
    }
    Console.WriteLine(message);
    return default;
}
```

按照惯例,这些功能是使用接口类型进行键控的,例如上面示例中的 `IDispatchInformationFeature`  

>`字段`用于"传输连接"进行通信,而功能用于调度管道内的本地通信。`IceRPC`同时提供请求字段（由请求承载）和响应字段（由响应承载）,但只提供请求特性:由于它都是本地的,因此不需要响应特性。

[fields]: ../invocation/outgoing-request#request-fields

[IFeatureCollection]: csharp:IceRpc.Features.FeatureCollection
[IDispatchInformationFeature]: csharp:IceRpc.Features.IDispatchInformationFeature
