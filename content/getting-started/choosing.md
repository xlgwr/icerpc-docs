---
title: Choosing between Slice and Protobuf
description: Learn why you need an IDL and which IDL makes the most sense for you.
---

## Slice 和 Protobuf 是什么?

IceRPC的核心是一个面向字节`bytes`的RPC框架 : 它可以轻松地发送携带字节的请求`requests`,并接收携带更多字节的响应`responses`.

IceRPC以字节为中心的体系结构和API,正是我们移动字节时所需要的功能。然而，如果想为RPC服务定义一个类型化的网络API，并不特别方便.

在RPCs的上下文中，使用[接口定义语言]（IDL）来指定RPCs是非常常见的. 这些
定义也称为客户端和服务器之间的`契约`[`contract`]

代码生成器，根据这些定义[`contract`]生成代码，有如下功能:

- 通过选择的编程语言，提供类型化的API
- 通过将类型化数据（整数、字符串、structs等）编码/解码`encoding/decoding`到字节流中,或从字节流中解码,来实现此API,以方便定义友好的结构格式

使用IDL，完全不必担心如上细节。将数据结构，编码为可移植二进制格式和将其解码为可移植的二进制格式:
所有这些都由代码生成器，及其支持库来处理.

IceRPC 完全支持两个IDL及其相关的序列化格式: [Slice] and [Protobuf]. 来看看，应该选哪个!

## Slice

Slice是与IceRPC协同开发的现代IDL和序列化格式. 它充分利用了所有
IceRPC的特性，并且在代码大小和带宽使用方面都非常紧凑.

例如，IceRPC支持单向RPCs（发送后不理会），Slice提供单向操作
映射到这些单向RPCs. 而Protobuf RPC方法总是返回一个响应,不支持使用Protobuf发送单向RPCs.

可以将Slice视为IceRPC的默认IDL：除非有充分的理由使用Protobuf，否则请使用Slice.

## Protobuf

Protobuf（Protocol Buffers）是Google创建的一种流行的IDL和序列化格式。这是一个常见的二进制JSON的替代方案，在谷歌内部广泛使用.

如果已经熟悉Protobuf，或者您的应用程序与使用或发送的其他应用程序交互
Protobuf消息，应该将IceRPC与Protobuf一起使用.

[接口定义语言]: https://en.wikipedia.org/wiki/Interface_description_language
[Protobuf]: https://en.wikipedia.org/wiki/Protocol_Buffers
[Slice]: ../slice
