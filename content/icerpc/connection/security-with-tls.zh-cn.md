# TLS 的安全性

> 了解如何使用TLS保护连接

## TLS - 传输功能

`Ice` 和 `icerpc` 协议既安全也并非不安全,因为使用 TLS 保护通信，是底层传输的责任。

`icerpc` 协议没有类似`https`"s"变化,也没有用于安全 `icerpc` 连接的独特安全端口。 当看到服务器地址 `icerpc://hello.zeroc.com` 时, 可以看到服务器正在监听默认的 icerpc 端口，但无法判断连接到该服务器的连接，将使用哪种传输，以及该传输是否使用了 `TLS`。

## Quic

 `Quic` 传输协议，始终是安全的。 如果将客户端连接配置为使用 `Quic`,则该连接将使用 `TLS`。

例如:

```csharp
// Always uses TLS.
await using var connection = new ClientConnection(
    "icerpc://hello.zeroc.com",
    multiplexedClientTransport: new QuicClientTransport());
```

同样的逻辑也适用于服务器:如果将服务器配置为使用 `Quic`,则该服务器接受的任何连接都将使用 `TLS`。

在 C# 中,需要为任何使用 `Quic` 的服务器指定 `TLS` 配置，特别是 `X.509` 证书。

例如:

```csharp
// SslServerAuthenticationOptions is required with QuicServerTransport.
await using var server = new Server(
    new Chatbot(),
    new SslServerAuthenticationOptions
    {
        ServerCertificate = new X509Certificate2("server.p12")
    },
    multiplexedServerTransport: new QuicServerTransport());
```

## Tcp

`Tcp` 传输可以使用,也可以不使用 `TLS`。如果在为 `Tcp` 创建客户端连接时指定 `TLS` 配置,则该连接将使用 `TLS`。如果不指定 `TLS` 配置，连接将不会使用 `TLS`。

在 C# 中,该客户端 `TLS` 配置由 [SslClientAuthenticationOptions] 参数提供。例如:

```csharp
// The default multiplexed transport for icerpc is tcp (implemented by SlicClientTransport over TcpClientTransport).
// This connection does not use TLS since we don't pass a SslClientAuthenticationOptions parameter.
await using var plainTcpConnection = new ClientConnection("icerpc://hello.zeroc.com");

// We pass a non-null SslClientAuthenticationOptions so the connection uses TLS.
await using var secureTcpConnection = new ClientConnection(
    "icerpc://hello.zeroc.com",
    new SslClientAuthenticationOptions());
```

对于`Tcp`的服务器来说，是一样的。如果在创建此服务器时，指定 `TLS` 配置，则服务器将仅接受 `TLS` 保护的连接。 如果在创建此服务器时未指定 TLS 配置，则服务器将仅监听并接受简单的 tcp 连接。

## SSL (限于`ice`)

`Ice` 服务器地址可以指定ssl传输，比如 `ice://hello.zeroc.com?transport=ssl`. 这种`Ice`特定的 `ssl` 传输与 `tcp` 传输相同，连接始终安全。在这方面，`ssl` 就像 `quic`。

例如:

```csharp
// Uses the default client transport, TcpClientTransport.
await using var connection = new ClientConnection("ice://hello.zeroc.com?transport=ssl");
```

相当于:

```csharp
await using var connection = new ClientConnection(
    "ice://hello.zeroc.com?transport=tcp",
    new SslClientAuthenticationOptions());
```

`ssl` 传输仅用于向后兼容 `Ice`:`Ice` 应用程序请求安全连接的标准方式是使用具有 `ssl` 服务器地址的代理。

`IceRPC` + `Slice` 解码具有 `ssl` 服务器地址的服务地址时,`ssl` 传输捕获此信息("需要 `TLS`")并确保客户端在调用此服务地址时建立安全连接。

> 对于 `Ice`,`tcp` 传输意味着"不使用 `TLS`". 对于 `IceRPC`,`tcp` 传输意味着普通 `tcp` 或 `tcp` + `tls`,具体取决于 `TLS` 配置。

`Icerpc` 协议,客户端和服务器都必须有相同的 `TLS` 期望配置,并且带有 `transport=tcp` 的 icerpc 服务器地址,并不是指服务器都需要 `TLS`。

## coloc 传输

用于测试的 `coloc` 传输，不支持 `TLS`，如果使用 `coloc` 指定 TLS 配置,将收到错误。

```csharp
// Does not work: can't get a TLS connection with a transport that doesn't support TLS.
await using var connection = new ClientConnection(
    "icerpc://colochost",
    new SslClientAuthenticationOptions()
    multiplexedClientTransport: new SlicClientTransport(colocClientTransport));
```

[SslClientAuthenticationOptions]: https://learn.microsoft.com/en-us/dotnet/api/system.net.security.sslclientauthenticationoptions
