# 服务器地址 `ServerAddress`

> 了解服务器地址的概念和语法。

## 语法

服务器地址[URI]具有以下语法: `protocol://host[:port][?name=value][&name=value...]`

- `protocol` 协议 (URI方案)，目前支持 `ice` 或 `icerpc`
- `host` DNS 名称 或 IP 地址
- `port` 端口号; 未指定时，默认端口为 4061 `ice` 和 4062 `icerpc`

服务器地址 URI 必须具有空路径且没有片段。它可以有查询参数，这些参数通常是特定于传输的。

查询参数传输 `transport` 指定底层传输的名称。大多数应用程序使用单个传输，并将此传输配置作为它们可以使用的唯一传输。 因此，在服务器地址中省略传输`transport`是很常见的。

C# 中，结构体 `ServerAddress` 是服务器地址 URI 的解析和验证，用于保存URI信息等。

## 客户端连接配置

客户端连接的主要配置是服务器的地址。 它告诉客户端连接如何到达服务器。DNS 名称在这些服务器地址中是很常见的。

例如:

| 服务器地址                      | 说明                                                                                                         |
| ------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| `icerpc://hello.zeroc.com`          | 使用 `icerpc` 协议连接到端口 4062 上的 `hello.zeroc.com` ， 未指定底层传输。 |
| `icerpc://192.168.100.10:10000?transport=quic` | 使用 QUIC 上的 `icerpc` 协议，连接端口 10000 上的 `192.168.100.10` Ip地址                    |
| `ice://hello.zeroc.com`             |  使用 ice 协议连接端口 4061 上的 `hello.zeroc.com` 地址 |

## 服务器配置

指定构建服务器时，要监听的服务器地址。

如果不指定服务器地址，默认值为 `icerpc://[::0]`，这意味着，监听默认 `icerpc` 端口 (4062) 上所有接口上的 `icerpc` 连接。  

构建服务器时，服务器地址的主机必须是`[::0]`这样的通配符ip地址，或者是当前系统上特定接口的ip地址。

如果端口号指定 0，操作系统将自动分配其短暂范围内的端口号。因为服务器不会监听 tcp 或 udp 端口 0。

以下是一些示例:

| 服务器地址            | 说明                                                                                                         |
| --------------------------|-----------------------------------------------------------------------------------------------------------------|
| `icerpc://192.168.100.10` | 使用默认 `icerpc` 端口 4062，监听与 `192.168.100.10` 关联的接口上的 `icerpc` 连接。 |
| `icerpc://[::0]:0`        | 监听所有接口上的 `icerpc` 连接；操作系统自动选择要使用的端口号。                         |
| `ice://0.0.0.0:10000`     | 10000 端口上 IPv4 地址的所有接口上监听 ice 连接。        |

C# 中， 当在服务器地址中指定端口 0 时， `Listen` 会返回一个服务器地址， 其中包含 OS 选择的端口号；

```csharp
using IceRpc;

await using var server = new Server(...,new Uri("icerpc://[::1]:0"));
ServerAddress actualServerAddress = server.Listen();
Console.WriteLine($"server is now listening on {actualServerAddress}"); // shows actual port
// then somehow share this server address with the clients

```

[Listen]: csharp:IceRpc.Server#IceRpc_Server_Listen
[ServerAddress]: csharp:IceRpc.ServerAddress
[URI]: https://baike.baidu.com/item/URI/2901761
