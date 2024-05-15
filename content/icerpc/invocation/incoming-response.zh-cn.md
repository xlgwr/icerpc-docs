# 传入响应 Incoming response

> 了解如何演绎传入的响应。

## 收到传入响应

调用器 `invoker` 异步返回传入响应。该传入响应是由连接从对等点接收响应时创建的。

传入响应包含哪些内容:

- 状态代码 `status code`
- 错误消息,仅在状态代码不是`OK`时设置
- 响应字段  `fields`
- 响应的有效负载 `payload`

## 状态代码 `Status code`

状态代码表示对等方发送的状态。`Ok`或错误都可以。`StatusCode` 是 `Slice` 中定义的枚举:

```slice
unchecked enum StatusCode : varuint62 {
    Ok = 0
    ApplicationError
    NotFound
    NotImplemented
    ... more errors ...
}
```

消耗响应的调用者，使用此状态代码来计算响应有效负载 `payload` 的内容。例如,当调用者是由 `Slice` 编译器生成的代码时,它将 Ok 时，意味着响应`payload`持有 `Slice` 编码的返回值。

## 响应字段  `fields`

响应字段表示响应携带的带外信息。这些字段通常由中间件`middleware`和拦截器`interceptors`读取和写入,以协调服务器和客户端中相同响应的处理。

字段是字典 `ResponseFieldKey` 中字节序列的条目,其中 `ResponseFieldKey` 是在 `Slice` 中定义的枚举。

```slice
unchecked enum ResponseFieldKey : varuint62 {
    CompressionFormat = 2
    ...
}
```

例如,当压缩中间件压缩传出响应的有效负载时,它会设置响应字段 `CompressionFormat`。这告诉连接另一侧的压缩机拦截器"该有效载荷被 `brotli` 压缩";然后压缩拦截器可以解压缩该（传入）响应有效负载。

## 有效负载响应 Response payload

传入响应的有效负载是表示操作返回值的**字节流**。IceRPC而言,该流中的字节数是未知的。

[dispatch]: ../dispatch/dispatch-pipeline#definition
[interceptors]: interceptor
[middleware]: ../dispatch/middleware
[Slice]: /slice

[ResponseFieldKey]: https://github.com/icerpc/icerpc-slice/blob/main/IceRpc/ResponseFieldKey.slice
[StatusCode]: https://github.com/icerpc/icerpc-slice/blob/main/IceRpc/StatusCode.slice
[CompressionFormat]: https://github.com/icerpc/icerpc-slice/blob/main/IceRpc/CompressionFormat.slice
