# "请求"生命线之意义非凡

> 本文将深入探讨将`截止时间`纳入RPCs的重要性, 以开发更强大的分布式应用程序。

## 概述

RPC（远程过程调用）系统中发送请求，通常会带来不确定性：无法保证，何时会收到回复，或请求需要多长时间，才能到达目的地。 由于各种原因,请求可能会被延迟:

* 目标服务可能会不堪重负,无法及时响应
* 网络拥堵可能会减慢流量
* 或者技术问题可能根本无法阻止目标服务处理请求（同步阻塞、假死等）

这些场景强调了分布式应用程序设计，准备处理延迟调用，或无法完成的调用的重要性

我们将探讨使用`截止时间`,是如何帮助构建更强大的分布式应用程序的。</br>
但首先,让我们先了解如果不使用`截止时间`，会产生什么后果呢？

## 无`截止时间`如何影响分布式系统

> 想象一下，前端服务依赖于一系列后端服务，来完成其任务的场景。假设这些基本后端服务之一，发生故障并且无法处理请求。我们的前端服务，继续处理客户的请求。并且每次都需要使用，有故障的后端服务来完成请求,请求都会被卡住，无限期地，等待从未到达的响应。

因此,满足请求所需的资源仍然无限期地被占用。在这种情况下，由于请求无法完成，前端的资源利用率将稳步提高。

最糟糕表现之一：是发生在同步进行远程调用时,导致线程在等待响应时被阻止. 迟早，所有可用的线程都可能被卡住,等待永远无法完成的请求. 幸运的是,`IceRPC`的设计，从源头上是异步的,可以防止落入这个陷阱。

然而,请求所需的其他资源（例如内存和文件句柄）无法释放,这进一步削弱了系统处理新请求的能力。

在其他场景中,应用程序可能需要快速返回响应。如果当前调用，不再需要，没有释放被占用，会浪费重要的服务器资源。

## 什么是请求截止时间？

要了解请求**截止时间**,我们必须首先掌握超时的情况。超时是指调用者愿意等待，调用完成多长时间的时间间隔。在 C# 中,该持续时间由 [System.TimeSpan] 类型表示。

**截止时间**可以被视为"绝对超时",由调用者认为可以接受，等待调用完成的时间点表示。在 C# 中,截止时间由 [System.DateTime] 类型表示。

**截止时间**提供了一种简单的机制,有助于在调用者不再有兴趣，等待其完成后取消调用和发送。

使用超过超时的**截止时间**的优点是,它们可以使用`请求字段`与`请求`一起传输,使目标服务能够在**截止时间**过去时取消调度,并在从调度完成的嵌套调用中使用**截止时间**。而在`请求字段`中传输超时是无效的,因为目标服务无法确定调用的确切开始时间或超时何时到期。

在进行远程程序时（RPC）,加入**截止时间**至关重要。 一般通常会选择超时,并根据该超时计算截止时间。为特定操作选择最佳超时，可能需要一些反复试验。如果超时设置得太低,可能会遇到不必要的故障。相反,如果设置得太高,错误检测可能会被延迟。所以，为正常情况下的操作，提供足够的时间；并为不同负载条件下可能出现的小延迟，留出一些空间。

## IceRPC（C#）中的截止时间

从 IceRPC 成立以来,很明显,支持**截止时间**的机制至关重要。此外, IceRPC 决定利用标准中间件和拦截器在 IceRPC 核心之外实现此功能。

这种方法不仅允许用户集成自己的实现,还可以证明 IceRPC 核心的灵活性。它展示了核心通过独立拦截器和中间件容纳此类机制的能力。

[IceRpc.Deadline] NuGet包，包括拦截器和中间件,可以在调用和调度管道中使用**截止时间**

在最简单的场景中,可以在调用管道[invocation pipeline]中使用**截止时间**拦截器并设置默认调用超时,从中计算**截止时间**:

```cs

// Create an invocation pipeline with the deadline interceptor and a default timeout of 500 ms.
Pipeline pipeline = new Pipeline()
    .UseDeadline(defaultTimeout: TimeSpan.FromMilliseconds(500))
    .Into(connection);
```

处理请求时,**截止时间**拦截器执行以下几个操作:

* 如果请求没有关联的截止时间,它会使用默认超时生成一个截止时间
* 它建立了一个取消令牌源,一旦到达截止时间,该源就会取消调用
* 它在传出请求字段中添加了截止时间字段
* 如果由于截止时间过去而取消调用,则会抛出超时异常`TimeoutException`
* 对于单向请求,拦截器无法取消调度,因为单向请求通常在调度开始之前完成。

并非所有请求都需要相同的截止时间设置,`IDeadlineFeature` 允许**自定义截止时间**:

```cs

// Customize the invocation deadline for a specific request to ensure it isn't canceled prematurely.
var features = new FeatureCollection();
features.Set<IDeadlineFeature>(DeadlineFeature.FromTimeout(TimeSpan.FromSeconds(10)));
```

值得注意的是,截止时间代表了一个确切的时间时刻。因此,应该在进行调用之前设置它。

icerpc 协议的一个显着特点是，它支持通过线路取消请求,截止时间拦截器有效地利用了这一点。当到达截止时间并且截止时间拦截器取消调用取消令牌时,它会触发底层[RPC流]的重置。此操作反过来取消发送，过程运行与目标服务的调度管道，与是否包括截止时间中间件无关。

在接收端,`调度管道`可以采用截止时间中间件将截止时间字段解码为相应的功能并独立于客户端强制执行截止时间。 这依赖于调用者通过某些外部机制（例如 NTP（网络时间协议）)同步他们的系统时钟。

```cs

// Add the deadline middleware to the dispatch pipeline.
Router router = new Router()
    .UseDeadline();
    .Map<...>(...);
```

如果由于截止时间过期，而在截止时间中间件之前取消发送,则它会返回状态代码`status code`等于`StatusCode.DeadlineExceeded`的传出响应.

此外,截止时间中间件使用解码截止时间初始化 'IDeadlineFeature' 。这允许从调度管道完成的嵌套调用，遵守相同的截止时间约束。

```cs

public async ValueTask<string> GreetAsync(
    string name,
    IFeatureCollection features,
    CancellationToken cancellationToken)
    {
        // By adding the deadline middleware features contains the deadline feature
        // created from the decoded deadline field.
```

## 结论

截止时间是开发更强大的分布式应用程序的重要机制,在进行远程调用时，始终包含截止时间,因为这可以确保应用程序不会陷入，等待永远不会到达的响应的困境,即使出了问题，也能够及时响应。

[System.TimeSpan]: https://learn.microsoft.com/en-us/dotnet/api/system.timespan
[System.DateTime]: https://learn.microsoft.com/en-us/dotnet/api/system.datetime
[IceRpc.Deadline]: https://www.nuget.org/packages/IceRpc.Deadline
[invocation pipeline]: https://docs.icerpc.dev/icerpc/invocation/invocation-pipeline
[RPC流]: https://docs.icerpc.dev/icerpc/icerpc-protocol/mapping-rpcs-to-streams