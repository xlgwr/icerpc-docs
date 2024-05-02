# The Significance of Request Deadlines

> This blog post delves into the importance of incorporating deadlines in RPCs to make more robust distributed applications.

## Overview

Sending a request in an RPC (Remote Procedure Call) system often comes with uncertainties—there's no guarantee when you'll receive a response or how long it will take for the request to reach its destination. Requests can be delayed for various reasons:

* the target service might be overwhelmed and unable to respond promptly,
* network congestion could slow down traffic,
* or technical issues might prevent the target service from processing requests at all.

These scenarios highlight the importance of designing distributed applications that are prepared to deal with delayed invocations, or invocations that are unable to complete.

In this blog post, we'll explore how using deadlines helps to build more robust distributed applications. But first, let's better understand the consequences of not using them.

## Understanding How the Lack of Deadlines Affects Distributed Systems

> Imagine a scenario where a frontend service depends on a series of backend services to fulfill its tasks. Suppose one of these essential backend services malfunctions and cannot process requests. Our frontend service continues to process requests from customers. However, each time it needs to use the faulty backend service to complete a request, the request gets stuck, waiting indefinitely for a response that never arrives.

As a result, the resources required to fulfill the request remain indefinitely tied up. Under these circumstances, with the request unable to complete, the frontend's resource utilization will steadily increase.

One of the worst manifestations of this issue occurs when a remote invocation is made synchronously, causing a thread to be blocked while waiting for a response. Sooner or later, all available threads could be stuck, waiting for requests that will never be completed. Fortunately, IceRPC is designed to be purely asynchronous, preventing you from falling into this trap.

However, other resources required by the request, such as memory and file handles, cannot be released, further straining the system's ability to process new requests.

In other scenarios, an application may need to return a response quickly. If invocations are not canceled after the caller no longer needs them, it ends up wasting important server resources dispatching requests that are no longer required by the caller.

## What Are Request Deadlines?

To understand request deadlines, we must first grasp what timeouts are. A timeout is a time interval indicating how long the caller is willing to wait for an invocation to complete. In C#, this duration is represented by the [System.TimeSpan] type.

A deadline can be thought of as an "absolute timeout", represented by the point in time until which the caller considers acceptable to wait for the invocation to complete. In C#, a deadline is represented by the [System.DateTime] type.

Deadlines provide a straightforward mechanism that facilitates the cancellation of invocations and dispatches after the caller is no longer interested in waiting for its completion.

The advantage of using deadlines over timeouts is that they can be transmitted alongside the request using request fields, enabling the target service to cancel the dispatch if the deadline has passed, and using the deadline in nested invocations done from the dispatch. Transmitting a timeout in the request fields is not effective, as the target service cannot determine the exact start time of the invocation or when the timeout should expire.

Incorporating a deadline is crucial when making a remote procedure call. You usually pick a timeout and the deadline is computed from it. Choosing the optimal timeout for a specific operation may require some trial and error. If the timeout is set too low, you may encounter unnecessary failures. Conversely, if it is set too high, error detection may be delayed. The goal is to give enough time for the operation to complete under normal circumstances and leave some room for small delays that can occur under different load conditions.

## Deadlines with IceRPC for C#

From the inception of IceRPC, it was evident that supporting mechanisms for deadlines was essential. Moreover, we decided to implement this feature outside the IceRPC core, utilizing standard middleware and interceptors.

This approach not only allows users to integrate their own implementations but also serves as proof of IceRPC core's flexibility. It demonstrates the core's capability to accommodate such mechanisms through independent interceptors and middleware.

For IceRPC for C#, the [IceRpc.Deadline] NuGet package includes both an interceptor and middleware, enabling the usage of deadlines within both invocation and dispatch pipelines.

In the simplest scenario, you can use the deadline interceptor in your [invocation pipeline] and set a default invocation timeout from which deadlines would be computed:

```cs

// Create an invocation pipeline with the deadline interceptor and a default timeout of 500 ms.
Pipeline pipeline = new Pipeline()
    .UseDeadline(defaultTimeout: TimeSpan.FromMilliseconds(500))
    .Into(connection);
```

When processing a request, the deadline interceptor performs several actions:

* If the request does not have an associated deadline, it generates one using the default timeout.
* It establishes a cancellation token source that cancels the invocation once the deadline is reached.
* It adds a deadline field to the outgoing request fields.
* It throws a `TimeoutException` if the invocation is canceled due to the deadline passing.
* For a one-way request the interceptor cannot cancel the dispatch, since one-way requests usually complete before the dispatch starts.

Recognizing that not all requests will require the same deadline settings, the `IDeadlineFeature` allows for the customization of deadlines:

```cs

// Customize the invocation deadline for a specific request to ensure it isn't canceled prematurely.
var features = new FeatureCollection();
features.Set<IDeadlineFeature>(DeadlineFeature.FromTimeout(TimeSpan.FromSeconds(10)));
```

It's crucial to note that the deadline represents an exact moment in time. Therefore, it should be set just before making the invocation, you don't want to set a deadline that is already expired before the invocation starts.

One notable feature of the icerpc protocol is its support for request cancellation across the wire, which the deadline interceptor leverages effectively. When a deadline is reached and the deadline interceptor cancels the invocation cancellation token, it triggers the reset of the underlying [RPC stream]. This action, in turn, cancels the dispatch. Remarkably, this process operates independently of whether or not the target service's dispatch pipeline includes the deadline middleware.

On the receiving end, the `dispatch pipeline` can employ the deadline middleware to decode the deadline field into a corresponding feature and enforce the deadline independently of the client. This relies on the participants to have their system clocks synchronized by some external mechanism such as NTP (Network Time Protocol).

```cs

// Add the deadline middleware to the dispatch pipeline.
Router router = new Router()
    .UseDeadline();
    .Map<...>(...);
```

If a dispatch is canceled by the deadline middleware due to an expired deadline, it returns an outgoing response with the `status code` equal to `StatusCode.DeadlineExceeded`.

Furthermore, the deadline middleware initializes the `IDeadlineFeature` with the decoded deadline. This allows nested invocations done from the dispatch pipeline to adhere to the same deadline constraints.

```cs

public async ValueTask<string> GreetAsync(
    string name,
    IFeatureCollection features,
    CancellationToken cancellationToken)
    {
        // By adding the deadline middleware features contains the deadline feature
        // created from the decoded deadline field.
```

## Conclusion

Deadlines are an essential mechanism for making more robust distributed applications, always include a deadline when making a remote invocation as this ensures your applications don't get stuck waiting for responses that would never arrive, and will be able to release resources is a timely manner, even when things go wrong.

[System.TimeSpan]: https://learn.microsoft.com/en-us/dotnet/api/system.timespan
[System.DateTime]: https://learn.microsoft.com/en-us/dotnet/api/system.datetime
[IceRpc.Deadline]: https://www.nuget.org/packages/IceRpc.Deadline
[invocation pipeline]: https://docs.icerpc.dev/icerpc/invocation/invocation-pipeline
[RPC stream]: https://docs.icerpc.dev/icerpc/icerpc-protocol/mapping-rpcs-to-streams