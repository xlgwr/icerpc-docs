# 传出响应`Outgoing response`

>了解如何创建传出响应。

## 创建传出响应

调度程序异步返回传出响应。

传出响应携带如下内容:

- 状态代码
- 错误消息,仅在状态代码非OK时设置
- 响应字段
- 响应的有效负载`payload`

## 响应有效负载

 响应的有效负载，是表示操作返回值的字节流。调用者（发送传入请求的连接）读取这些字节，并逻辑地复制到网络连接,直到不再有字节需要读取。

C#中,传出响应的有效负载，被分割为有效负载和有效负载延续,就像传出请求的有效负载一样。这种分割，使得响应有效负载的编码，对于Slice生成的代码来说，更加方便和高效,但在其他方面，是不必要的。出发响应有效负载，在概念上是一个连续的字节流。

[fields]: ../invocation/incoming-response#response-fields
[outgoing request]: ../invocation/outgoing-request
[status code]: ../invocation/incoming-response#status-code
[Slice]: /slice
