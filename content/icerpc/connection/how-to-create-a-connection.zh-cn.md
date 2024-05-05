# 如何创建连接`connection`

> 学习如何使用IceRPC，创建和接受连接。

## 连接有什么用途？

连接在 IceRPC 中发挥着核心作用: 通过连接向服务端发送请求,然后通过同一连接收到响应。 在此连接的另一端,IceRPC 接收此请求,将其交给服务端,然后发送回服务端返回的响应。

当应用程序创建与服务端的连接时,该连接就是"客户端连接"。当服务端接受客户端的连接时,该连接称为"服务端连接"。
一旦建立连接,客户端连接和服务端连接之间就没有区别。可以使用相同的API，在客户端连接或服务端连接上进行调用（发送请求并接收相应的响应）。任何连接,无论是客户端还是服务端,都可以接受传入的请求，并将这些请求发送到服务端。

## 创建客户端连接

C# 中,可以使用 `ClientConnection` 类或 `ConnectionCache` 类创建客户端连接。例如:

```csharp
using IceRpc;

await using var clientConnection = new ClientConnection(new Uri("icerpc://hello.zeroc.com"));
```

`ClientConnection` 的构造函数指定了服务器的地址,但实际上并未建立连接。连接稍后通过异步调用（例如 `ConnectAsync` 或 `InvokeAsync`）建立:

```csharp
// establishes the connection explicitly
await clientConnection.ConnectAsync();
```

客户端连接维护单个活动连接：连接到服务器的（客户端）连接。

连接缓存`connection cache`维护服务器地址到（客户端）连接的字典缓存。每个连接都连接到不同的服务器。连接缓存有助于定位和重用这些连接。

## 创建服务端

在服务端,接受与服务器`Server`类实例的服务端连接。该服务端监听并接受其配置的服务器地址上的新连接。

在 C# 中, 这又是两步过程, 首先构建一个服务器`Server`实例, 然后调用 `Listen` 方法：

```csharp
using IceRpc;

// constructs and configures server
await using var server = new Server(...);

// starts listening for new connections
server.Listen();
```

服务端接受连接并记住它接受了哪些连接。服务端可以方便的关闭这些连接。

## 总结

> 虽然简短，但很重要，一个连接，创建万物互联，引起一个五彩斑斓的世界。

[ClientConnection]: csharp:IceRpc.ClientConnection
[ConnectionCache]: csharp:IceRpc.ConnectionCache
[Server]: csharp:IceRpc.Server
[Listen]: csharp:IceRpc.Server#IceRpc_Server_Listen
