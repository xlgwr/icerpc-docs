---
title: Quickstart
description: Create a new IceRPC application from scratch with a few simple commands.
---

# 快速入门
演示如何在几分钟内,使用`IceRPC`,构建和运行一个完整的客户端-服务器(C/S)应用程序.

必要条件: 只要电脑安装 [.NET 8 SDK] 就行了.

<b>来吧,开始你的RPC之旅</b>

接下来,我们要一起构建一个简单的网络应用程序,包括如下:

- 服务端: 一个叫 greeter 服务的服务器
- 客户端: 与服务器建立连接,并注册`greeter`服务,之后调用服务`greet`方法

客户端与服务器都是使用普通的控制台应用程序,没有Asp.net,没有依赖注入,简单吧.

来,我们开始:

第一步,我们先安装一个`dotnet`模板(打开cmd或terminal),可以快速生成,启动项目:

```shell {% showTitle=false %}
dotnet new install IceRpc.Templates
```



接下来,我们创建一个服务端:

直接用刚安装的模板,用 `icerpc-slice-server` 建一个服务`MyServer`,如下示:

```shell
dotnet new icerpc-slice-server -o MyServer
```

上面运行后,会生成 IceRPC + Slice 集成服务端项目,生成在目录 `MyServer` 下.


接下来,差不多,我们也用另一个模板 `icerpc-slice-client` 生成一个客户端叫`MyClient`:

```shell
dotnet new icerpc-slice-client -o MyClient
```

上面运行后,会生成 IceRPC + Slice 集成客户端项目,生成在目录 `MyClient` 下.


现在,我们完成了客户端与服务端的生成,来,我们运行它吧.

### 启动服务端

进入刚生成的服务端目录`MyServer`,运行如下指令:

```shell
cd MyServer
dotnet run
```

服务器现在正在侦听来自客户端的新连接:

```
dbug: IceRpc.Server[11]
      Listener 'icerpc://[::0]?transport=tcp' has started accepting connections
```

### 启动客户端

打开另一个CMD或terminal,来启动客户端:

```shell
cd MyClient
dotnet run
```

 客户端向服务器托管的服务发送一个`greet`请求:

```
dbug: IceRpc.ClientConnection[3]
      Client connection from '[::1]:61582' to '[::1]:4062' connected
info: IceRpc.Logger.LoggerInterceptor[0]
      Sent request greet to icerpc:/VisitorCenter.Greeter over
      [::1]:61582<->[::1]:4062 and received a response with status code Ok
Hello, Reece!
dbug: IceRpc.ClientConnection[6]
      Client connection from '[::1]:61582' to '[::1]:4062' shutdown
dbug: IceRpc.ClientConnection[5]
      Client connection from '[::1]:61582' to '[::1]:4062' disposed
```



## 接下来

  祝贺,我们已经成功创建了第一个IceRPC应用程序,RPC大门已为您打开.


[.NET 8 SDK]: https://dotnet.microsoft.com/zh-cn/download