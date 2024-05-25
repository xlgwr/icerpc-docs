# 中间件`Middleware`

> 了解如何安装和编写中间件。

## 拦截传入的请求

中间件是在传入请求到达目标服务之前拦截传入请求的代码。相同的代码还会在服务发送回呼叫者之前拦截服务提供的传出响应。

在技术层面上,中间件是调度程序,它保存另一个调度程序("下一个")并在下一个调度程序上调用调度,作为其自己的调度方法实现的一部分。下一个调度程序可以是另一个中间件、服务、路由器或其他类型的调度程序;就中间件而言,它只是另一个调度程序。

中间件可以包括在下一个调度程序调用调度之前（在处理请求之前）和在下一个调度程序调用调度之后（在收到响应之后）的逻辑。 中间件还可以通过返回缓存响应或返回错误（具有 Ok 以外的状态代码的响应）来短路调度管道。

例如,一个简单的 C# 中间件可能如下所示:

```csharp
public class SimpleMiddleware : IDispatcher
{
    private readonly IDispatcher _next;

    public SimpleMiddleware(IDispatcher next) => _next = next;

    public async ValueTask<OutgoingResponse> DispatchAsync(
        IncomingRequest request,
        CancellationToken cancellationToken)
    {
        Console.WriteLine("before _next.DispatchAsync");
        OutgoingResponse response = await _next.DispatchAsync(request, cancellationToken);
        Console.WriteLine($"after _next.DispatchAsync; the response status code is {response.StatusCode}");
        return response;
    }
}
```

## 安装中间件

可以使用路由器，创建调度管道并在此调度管道中安装一个或多个中间件。
